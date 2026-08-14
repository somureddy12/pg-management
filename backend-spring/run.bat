@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d "%~dp0"
C:\apache-maven\apache-maven-3.6.0\bin\mvn.cmd spring-boot:run
