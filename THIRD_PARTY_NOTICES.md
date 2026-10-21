# Third-party notices / 第三方软件声明

This repository includes or uses third-party software. Their copyrights and licenses remain with their respective owners. 本仓库包含或依赖第三方软件，其版权与许可证仍归原权利人所有。

| Component | Usage | License |
| --- | --- | --- |
| [Intel PresentMon](https://github.com/GameTechDev/PresentMon) | `vendor/PresentMon/PresentMon.exe` | License text: [`vendor/PresentMon/LICENSE.txt`](vendor/PresentMon/LICENSE.txt) |
| [React and React DOM](https://github.com/facebook/react) | Code included in the extracted renderer bundle | MIT; original copyright notices are retained in the bundle |
| [react-draggable](https://github.com/react-grid-layout/react-draggable) | Code included in the extracted renderer bundle | MIT; original copyright notices are retained in the bundle |
| [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) | Code included in the extracted renderer bundle | MIT |
| [react-resizable](https://github.com/react-grid-layout/react-resizable) | Code included in the extracted renderer bundle | MIT |
| [Lucide React](https://github.com/lucide-icons/lucide) | Icons included in the extracted renderer bundle | ISC |
| [clsx](https://github.com/lukeed/clsx) | Code included in the extracted renderer bundle | MIT |
| [fast-equals](https://github.com/planttheidea/fast-equals) | Code included in the extracted renderer bundle | MIT |
| [prop-types](https://github.com/facebook/prop-types) | Code included in the extracted renderer bundle | MIT |
| [scheduler](https://github.com/facebook/react) | Code included in the extracted renderer bundle | MIT |
| [uPlot](https://github.com/leeoniya/uPlot) | Code included in the extracted renderer bundle | MIT; original copyright notice is retained in the bundle |
| [systeminformation](https://github.com/sebhildebrandt/systeminformation) | Runtime dependency, installed by package manager | MIT |
| [Electron](https://github.com/electron/electron) | Development runtime, installed by package manager | MIT |

The provided Electron build did not include the original frontend dependency manifest. Other transitive frontend code may also be present in the generated renderer bundle. Before redistributing a newly packaged binary, restore the original dependency manifest and verify all required notices. / 提供的 Electron 构建包不含原始前端依赖清单。生成后的前端文件还可能包含其他间接依赖代码。重新分发打包程序前，应恢复原始依赖清单并核对所需版权声明。
