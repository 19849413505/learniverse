@echo off
chcp 65001 >nul
color 0A

echo =======================================================
echo          Learniverse 一键安装与桌面端打包工具
echo =======================================================
echo.
echo 正在检查和安装所有必要的依赖...
echo 这可能需要几分钟，请耐心等待。
echo.

call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    color 0C
    echo [错误] 依赖安装失败！请检查您的网络连接或 npm 配置。
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================
echo 依赖安装完成！开始构建前端和后端代码并打包桌面应用...
echo =======================================================
echo.

call npm run build:desktop
if %ERRORLEVEL% neq 0 (
    echo.
    color 0C
    echo [错误] 打包过程中出现错误，请向上滚动查看具体的错误日志。
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================
color 0A
echo [成功] 桌面应用打包完成！
echo 您的安装包已存放在: packages\desktop\dist\ 目录下。
echo =======================================================
echo.
pause
