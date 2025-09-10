import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const pkgPath = path.resolve('package.json')

// 패키지 유효성 검증
fs.accessSync(path.resolve('dist'), fs.constants.F_OK)
fs.accessSync(path.resolve('dist/canvas-editor.es.js'), fs.constants.F_OK)
fs.accessSync(path.resolve('dist/canvas-editor.umd.js'), fs.constants.F_OK)

// 프로젝트 package.json 캐시
const sourcePkg = fs.readFileSync(pkgPath, 'utf-8')

// 불필요한 속성 삭제
const targetPkg = JSON.parse(sourcePkg)
Reflect.deleteProperty(targetPkg, 'dependencies')
Reflect.deleteProperty(targetPkg.scripts, 'postinstall')
fs.writeFileSync(pkgPath, JSON.stringify(targetPkg, null, 2))

// 패키지 배포
try {
  execSync('npm publish')
} catch (error) {
  throw new Error(error)
} finally {
  // 복원
  fs.writeFileSync(pkgPath, sourcePkg)
}
