// GENERATED FRAGMENT — extracted from out/main/index.js, lines 3420-3861.
// Original module marker: src/main/history/store.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
var RAW_STEP = 5e3;
var MINUTE_STEP = 6e4;
var HOUR = 36e5;
var DAY = 864e5;
var RAW_QUERY_LIMIT = 6 * HOUR;
var SCHEMA = `
create table if not exists series(
  id integer primary key,
  key text unique not null,
  label text not null,
  unit text not null,
  grp text not null
);
create table if not exists s5(
  sid integer not null, ts integer not null,
  vmin real not null, vmax real not null, vavg real not null, n integer not null,
  primary key(sid, ts)
) without rowid;
create table if not exists m1(
  sid integer not null, ts integer not null,
  vmin real not null, vmax real not null, vavg real not null, n integer not null,
  primary key(sid, ts)
) without rowid;
create table if not exists events(
  id integer primary key autoincrement,
  kind text not null, key text not null, severity text not null,
  title text not null, detail text not null default '', confidence text, extra text,
  ts_start integer not null, ts_end integer
);
create index if not exists ix_events_start on events(ts_start);
create table if not exists event_snap(
  event_id integer primary key references events(id) on delete cascade,
  json text not null
);
`;
var UPSERT_SAMPLE = (table) => `
insert into ${table}(sid, ts, vmin, vmax, vavg, n) values (?, ?, ?, ?, ?, ?)
on conflict(sid, ts) do update set
  vmin = min(vmin, excluded.vmin),
  vmax = max(vmax, excluded.vmax),
  vavg = (vavg * n + excluded.vavg * excluded.n) / (n + excluded.n),
  n = n + excluded.n`;
function parseEvent(r) {
	let extra = null;
	try {
		extra = r.extra ? JSON.parse(r.extra) : null;
	} catch {
		extra = null;
	}
	return {
		...r,
		extra
	};
}
var CORRUPT_RE = /corrupt|malformed|not a database|disk image/i;
var csv = (v) => {
	if (v == null) return "";
	const s = String(v);
	return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
};
var HistoryStore = class {
	db = null;
	dir;
	file;
	cfg;
	sids = /* @__PURE__ */ new Map();
	labels = /* @__PURE__ */ new Map();
	rawBucket = 0;
	rawAgg = /* @__PURE__ */ new Map();
	minuteBucket = 0;
	minuteAgg = /* @__PURE__ */ new Map();
	lastMaintain = 0;
	lastRecover = 0;
	lastError = null;
	upsertSeries = null;
	upsertRaw = null;
	upsertMinute = null;
	constructor(dir, cfg) {
		this.dir = dir;
		this.file = (0, node_path.join)(dir, "history.db");
		this.cfg = cfg;
	}
	open() {
		node_fs.mkdirSync(this.dir, { recursive: true });
		try {
			this.openDb();
		} catch (e) {
			this.recover(e);
		}
	}
	close() {
		try {
			this.flushAll();
		} catch {}
		try {
			this.db?.close();
		} catch {}
		this.db = null;
	}
	applySettings(cfg) {
		const wasEnabled = this.cfg.enabled;
		this.cfg = cfg;
		if (wasEnabled && !cfg.enabled) this.safely(() => this.flushAll());
		if (cfg.enabled) this.safely(() => this.maintain(Date.now()));
	}
	record(ts, values) {
		if (!this.db || !this.cfg.enabled) return;
		this.safely(() => {
			const bucket = Math.floor(ts / RAW_STEP) * RAW_STEP;
			if (this.rawBucket === 0) this.rawBucket = bucket;
			if (bucket > this.rawBucket) {
				this.flushRaw();
				this.rawBucket = bucket;
			}
			for (const m of values) {
				if (m.value == null) continue;
				const sid = this.ensureSeries(m);
				const a = this.rawAgg.get(sid);
				if (a) {
					a.min = Math.min(a.min, m.value);
					a.max = Math.max(a.max, m.value);
					a.sum += m.value;
					a.n += 1;
				} else this.rawAgg.set(sid, {
					min: m.value,
					max: m.value,
					sum: m.value,
					n: 1
				});
			}
			if (ts - this.lastMaintain > HOUR) this.maintain(ts);
		});
	}
	ensureSeries(m) {
		const cached = this.sids.get(m.key);
		if (cached !== void 0 && this.labels.get(m.key) === m.label) return cached;
		const row = this.upsertSeries.get(m.key, m.label, m.unit, m.group);
		this.sids.set(m.key, row.id);
		this.labels.set(m.key, m.label);
		return row.id;
	}
	flushRaw() {
		if (this.rawAgg.size === 0) return;
		const rows = [...this.rawAgg.entries()];
		this.rawAgg.clear();
		const bucket = this.rawBucket;
		const minute = Math.floor(bucket / MINUTE_STEP) * MINUTE_STEP;
		this.tx(() => {
			if (this.minuteBucket !== 0 && minute > this.minuteBucket) this.writeMinute();
			if (this.minuteBucket === 0 || minute > this.minuteBucket) this.minuteBucket = minute;
			for (const [sid, a] of rows) {
				this.upsertRaw.run(sid, bucket, a.min, a.max, a.sum / a.n, a.n);
				const m = this.minuteAgg.get(sid);
				if (m) {
					m.min = Math.min(m.min, a.min);
					m.max = Math.max(m.max, a.max);
					m.sum += a.sum;
					m.n += a.n;
				} else this.minuteAgg.set(sid, { ...a });
			}
		});
	}
	writeMinute() {
		for (const [sid, a] of this.minuteAgg) this.upsertMinute.run(sid, this.minuteBucket, a.min, a.max, a.sum / a.n, a.n);
		this.minuteAgg.clear();
	}
	flushAll() {
		if (!this.db) return;
		this.flushRaw();
		if (this.minuteAgg.size > 0) this.tx(() => this.writeMinute());
	}
	maintain(now) {
		this.lastMaintain = now;
		const c = this.cfg;
		this.tx(() => {
			this.db.prepare("delete from s5 where ts < ?").run(now - c.rawHours * HOUR);
			this.db.prepare("delete from m1 where ts < ?").run(now - c.minuteDays * DAY);
			this.db.prepare("delete from events where ts_start < ?").run(now - c.eventDays * DAY);
		});
		const cap = c.maxMB * 1024 * 1024;
		for (let i = 0; i < 8 && this.fileBytes() > cap; i++) {
			for (const t of ["s5", "m1"]) this.db.prepare(`delete from ${t} where ts <= (select ts from ${t} order by ts limit 1 offset (select count(*) / 10 from ${t}))`).run();
			this.db.exec("pragma wal_checkpoint(TRUNCATE); pragma incremental_vacuum;");
		}
		this.db.exec("pragma incremental_vacuum;");
	}
	fileBytes() {
		let total = 0;
		for (const f of [this.file, `${this.file}-wal`]) try {
			total += node_fs.statSync(f).size;
		} catch {}
		return total;
	}
	series() {
		if (!this.db) return [];
		return this.db.prepare("select key, label, unit, grp as \"group\" from series order by grp, key").all();
	}
	query(q, now = Date.now()) {
		const from = Math.floor(q.from);
		const to = Math.max(from + 1, Math.floor(q.to));
		const range = to - from;
		const maxPoints = Math.min(2e3, Math.max(50, Math.floor(q.maxPoints)));
		const tier = range <= RAW_QUERY_LIMIT && from >= now - this.cfg.rawHours * HOUR - RAW_STEP ? "raw" : "minute";
		const table = tier === "raw" ? "s5" : "m1";
		const step = tier === "raw" ? RAW_STEP : MINUTE_STEP;
		const bucket = Math.max(step, Math.ceil(range / maxPoints / step) * step);
		const start = Math.floor(from / bucket) * bucket;
		const count = Math.min(maxPoints + 2, Math.ceil((to - start) / bucket));
		const ts = Array.from({ length: count }, (_, i) => start + i * bucket);
		const empty = () => ({
			from,
			to,
			stepMs: bucket,
			tier,
			ts,
			series: q.keys.map((key) => ({
				key,
				min: ts.map(() => null),
				max: ts.map(() => null),
				avg: ts.map(() => null)
			})),
			coverageStart: null
		});
		if (!this.db || q.keys.length === 0) return empty();
		const ph = q.keys.map(() => "?").join(",");
		const idRows = this.db.prepare(`select id, key from series where key in (${ph})`).all(...q.keys);
		if (idRows.length === 0) return empty();
		const keyOf = new Map(idRows.map((r) => [r.id, r.key]));
		const sidPh = idRows.map(() => "?").join(",");
		const sids = idRows.map((r) => r.id);
		const rows = this.db.prepare(`select sid, (ts / cast(? as integer)) * cast(? as integer) as b,
                min(vmin) as mn, max(vmax) as mx, sum(vavg * n) / sum(n) as av
         from ${table} where sid in (${sidPh}) and ts >= ? and ts < ? group by sid, b`).all(bucket, bucket, ...sids, start, to);
		const result = empty();
		const bySeries = new Map(result.series.map((s) => [s.key, s]));
		for (const r of rows) {
			const s = bySeries.get(keyOf.get(r.sid));
			const i = Math.round((r.b - start) / bucket);
			if (!s || i < 0 || i >= count) continue;
			s.min[i] = r.mn;
			s.max[i] = r.mx;
			s.avg[i] = r.av;
		}
		result.coverageStart = this.db.prepare(`select min(ts) as t from ${table} where sid in (${sidPh})`).get(...sids).t;
		return result;
	}
	openEvent(e, snapshot) {
		if (!this.db || !this.cfg.enabled) return null;
		let id = null;
		this.safely(() => {
			this.tx(() => {
				id = this.db.prepare("insert into events(kind, key, severity, title, detail, confidence, extra, ts_start) values (?, ?, ?, ?, ?, ?, ?, ?) returning id").get(e.kind, e.key, e.severity, e.title, e.detail, e.confidence ?? null, e.extra ? JSON.stringify(e.extra) : null, e.ts).id;
				if (snapshot) this.db.prepare("insert into event_snap(event_id, json) values (?, ?)").run(id, JSON.stringify(snapshot));
			});
		});
		return id;
	}
	/** 结束一个事件；extra 不为空时同时更新证据（诊断事件结束时用持续期间最有代表性的一次） */
	closeEvent(id, ts, extra = null) {
		if (!this.db) return;
		this.safely(() => {
			this.db.prepare("update events set ts_end = max(ts_start, ?) where id = ? and ts_end is null").run(ts, id);
			if (extra) this.db.prepare("update events set extra = ? where id = ?").run(JSON.stringify(extra), id);
		});
	}
	listEvents(from, to, limit = 500) {
		if (!this.db) return [];
		return this.db.prepare(`select id, kind, key, severity, title, detail, confidence, extra, ts_start as tsStart, ts_end as tsEnd
         from events where ts_start < ? and (ts_end is null or ts_end >= ?)
         order by ts_start desc limit ?`).all(to, from, limit).map(parseEvent);
	}
	getEvent(id) {
		if (!this.db) return null;
		const raw = this.db.prepare(`select id, kind, key, severity, title, detail, confidence, extra, ts_start as tsStart, ts_end as tsEnd
         from events where id = ?`).get(id);
		if (!raw) return null;
		const event = parseEvent(raw);
		const snap = this.db.prepare("select json from event_snap where event_id = ?").get(id);
		let snapshot = null;
		try {
			snapshot = snap ? JSON.parse(snap.json) : null;
		} catch {
			snapshot = null;
		}
		return {
			event,
			snapshot
		};
	}
	stats() {
		const base = {
			enabled: this.cfg.enabled,
			fileBytes: this.fileBytes(),
			rawRows: 0,
			minuteRows: 0,
			eventCount: 0,
			oldestTs: null,
			newestTs: null,
			lastError: this.lastError
		};
		if (!this.db) return base;
		const one = (sql) => this.db.prepare(sql).get();
		base.rawRows = one("select count(*) as a from s5").a ?? 0;
		base.minuteRows = one("select count(*) as a from m1").a ?? 0;
		base.eventCount = one("select count(*) as a from events").a ?? 0;
		const span = one("select min(ts) as a, max(ts) as b from s5");
		const mspan = one("select min(ts) as a, max(ts) as b from m1");
		const olds = [span.a, mspan.a].filter((v) => v != null);
		const news = [span.b, mspan.b].filter((v) => v != null);
		base.oldestTs = olds.length ? Math.min(...olds) : null;
		base.newestTs = news.length ? Math.max(...news) : null;
		return base;
	}
	/** 导出 1 分钟聚合数据和事件为两份 CSV（带 BOM，Excel 直接打开不乱码） */
	exportCsv(seriesFile, eventsFile) {
		if (!this.db) throw new Error("历史数据库未打开");
		this.flushAll();
		const BOM = "﻿";
		const fd = node_fs.openSync(seriesFile, "w");
		try {
			node_fs.writeSync(fd, `${BOM}时间,指标,单位,最小值,最大值,平均值\r\n`);
			const it = this.db.prepare(`select m.ts as ts, s.label as label, s.unit as unit, m.vmin as vmin, m.vmax as vmax, m.vavg as vavg
           from m1 m join series s on s.id = m.sid order by m.ts, s.key`).iterate();
			let buf = [];
			for (const r of it) {
				const t = new Date(r.ts).toLocaleString("zh-CN", { hour12: false });
				buf.push([
					csv(t),
					csv(r.label),
					csv(r.unit),
					r.vmin.toFixed(2),
					r.vmax.toFixed(2),
					r.vavg.toFixed(2)
				].join(","));
				if (buf.length >= 5e3) {
					node_fs.writeSync(fd, buf.join("\r\n") + "\r\n");
					buf = [];
				}
			}
			if (buf.length) node_fs.writeSync(fd, buf.join("\r\n") + "\r\n");
		} finally {
			node_fs.closeSync(fd);
		}
		const lines = this.listEvents(0, Date.now() + DAY, 1e5).map((e) => [
			csv(new Date(e.tsStart).toLocaleString("zh-CN", { hour12: false })),
			csv(e.tsEnd ? new Date(e.tsEnd).toLocaleString("zh-CN", { hour12: false }) : "持续中"),
			csv(e.kind),
			csv(e.severity),
			csv(e.title),
			csv(e.detail),
			csv(e.confidence)
		].join(","));
		node_fs.writeFileSync(eventsFile, `${BOM}开始时间,结束时间,类型,级别,标题,详情,置信度\r\n${lines.join("\r\n")}\r\n`, "utf8");
	}
	clear() {
		if (!this.db) return;
		this.rawAgg.clear();
		this.minuteAgg.clear();
		this.rawBucket = 0;
		this.minuteBucket = 0;
		this.tx(() => {
			this.db.exec("delete from s5; delete from m1; delete from event_snap; delete from events;");
		});
		this.db.exec("pragma wal_checkpoint(TRUNCATE); pragma incremental_vacuum;");
	}
	openDb() {
		const db = new node_sqlite.DatabaseSync(this.file);
		try {
			const ver = db.prepare("pragma user_version").get().user_version;
			if (ver === 0) db.exec("pragma auto_vacuum = INCREMENTAL;");
			db.exec("pragma journal_mode = WAL; pragma synchronous = NORMAL; pragma foreign_keys = ON;");
			const check = db.prepare("pragma quick_check").get();
			if (check.quick_check !== "ok") throw new Error(`database disk image is malformed (${check.quick_check})`);
			db.exec(SCHEMA);
			if (!db.prepare("pragma table_info(events)").all().some((c) => c.name === "extra")) db.exec("alter table events add column extra text");
			if (ver < 2) db.exec("pragma user_version = 2;");
		} catch (e) {
			db.close();
			throw e;
		}
		this.db = db;
		this.upsertSeries = db.prepare(`insert into series(key, label, unit, grp) values (?, ?, ?, ?)
       on conflict(key) do update set label = excluded.label, unit = excluded.unit, grp = excluded.grp
       returning id`);
		this.upsertRaw = db.prepare(UPSERT_SAMPLE("s5"));
		this.upsertMinute = db.prepare(UPSERT_SAMPLE("m1"));
		this.sids.clear();
		this.labels.clear();
		db.exec(`update events set ts_end = max(ts_start, coalesce((select max(ts) from s5), ts_start)) where ts_end is null;`);
		this.maintain(Date.now());
	}
	tx(fn) {
		const db = this.db;
		db.exec("begin");
		try {
			fn();
			db.exec("commit");
		} catch (e) {
			try {
				db.exec("rollback");
			} catch {}
			throw e;
		}
	}
	safely(fn) {
		try {
			fn();
		} catch (e) {
			this.lastError = e instanceof Error ? e.message : String(e);
			console.error("[history]", this.lastError);
			if (CORRUPT_RE.test(this.lastError)) this.recover(e);
		}
	}
	recover(cause) {
		const now = Date.now();
		if (now - this.lastRecover < 6e5) return;
		this.lastRecover = now;
		const msg = cause instanceof Error ? cause.message : String(cause);
		try {
			this.db?.close();
		} catch {}
		this.db = null;
		this.rawAgg.clear();
		this.minuteAgg.clear();
		this.rawBucket = 0;
		this.minuteBucket = 0;
		for (const suffix of [
			"",
			"-wal",
			"-shm"
		]) try {
			node_fs.renameSync(this.file + suffix, `${this.file}.corrupt-${now}${suffix}`);
		} catch {}
		try {
			this.openDb();
			this.lastError = `历史数据库已损坏，旧文件已备份为 history.db.corrupt-${now}，并重新创建（${msg}）`;
		} catch (e) {
			this.db = null;
			this.lastError = `历史数据库无法使用：${e instanceof Error ? e.message : String(e)}`;
		}
	}
};
