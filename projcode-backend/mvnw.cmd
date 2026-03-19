@REM
@REM Copyright 2007-2015 the original author or authors.
@REM
@REM Licensed under the Apache License, Version 2.0 (the "License");
@REM you may not use this file except in compliance with the License.
@REM You may obtain a copy of the License at
@REM
@REM      http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing, software
@REM distributed under the License is distributed on an "AS IS" BASIS,
@REM WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@REM See the License for the specific language governing permissions and
@REM limitations under the License.
@REM

@echo off

SET CURRENT_DIR=%~dp0
SET MVN_HOME=%CURRENT_DIR%

REM Try to find the wrapper JAR
REM Look for a .mvn/wrapper/maven-wrapper.jar file relative to MVN_HOME
SET WRAPPER_JAR_PATH=%MVN_HOME%.mvn\wrapper\maven-wrapper.jar
IF EXIST "%WRAPPER_JAR_PATH%" GOTO FOUND_WRAPPER_JAR

REM If not found, assume we're in a subdirectory of the project root
REM and search upwards
SET ORIGINAL_MVN_HOME=%MVN_HOME%
:SEARCH_UPWARDS
IF "%MVN_HOME%"=="\" GOTO WRAPPER_JAR_NOT_FOUND
SET MVN_HOME=%MVN_HOME%..
FOR %%I IN ("%MVN_HOME%") DO SET MVN_HOME=%%~fI\
SET WRAPPER_JAR_PATH=%MVN_HOME%.mvn\wrapper\maven-wrapper.jar
IF EXIST "%WRAPPER_JAR_PATH%" GOTO FOUND_WRAPPER_JAR
GOTO SEARCH_UPWARDS

:WRAPPER_JAR_NOT_FOUND
ECHO ERROR: The Maven Wrapper JAR '%ORIGINAL_MVN_HOME%.mvn\wrapper\maven-wrapper.jar' does not exist.
ECHO Please ensure you have run 'mvn wrapper:wrapper' or copied the wrapper files correctly.
EXIT /B 1

:FOUND_WRAPPER_JAR

REM Set the Java command
IF DEFINED JAVA_HOME (
  SET JAVA_EXE="%JAVA_HOME%\bin\java"
) ELSE (
  SET JAVA_EXE="java"
)

REM Execute the Maven Wrapper
"%JAVA_EXE%" -jar "%WRAPPER_JAR_PATH%" %*
