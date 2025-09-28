# Docker Code Execution Environment

This document explains how to set up and use the Docker-based code execution environment for CBG (Coding Battle Ground).

## Overview

The system uses a Docker-based sandboxing approach to execute code securely for multiple programming languages:
- JavaScript (Node.js)
- TypeScript
- Python
- Java
- C++
- C
- Go
- Rust
- Ruby

Each code execution happens in an isolated Docker container with:
- Strict resource limits (CPU, memory, processes)
- Network isolation (no internet access)
- Limited permissions
- Execution timeouts

## Setup Instructions

### Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

### Building the Execution Environment

1. Build the sandbox Docker image:
   ```
   npm run docker:build-sandbox
   ```
   
   Alternatively, you can build it directly:
   ```
   docker build -t code-execution-sandbox:latest -f Dockerfile.sandbox .
   ```

2. Build and start the entire application:
   ```
   npm run docker:build
   npm run docker:up
   ```

## How It Works

1. The client submits code with a language selection.
2. The server validates the request and creates a temporary directory for the execution.
3. Code and input are saved to the temporary directory.
4. A Docker container is started with appropriate resource limits and isolation.
5. The code is executed inside the container against the provided test cases.
6. Results are collected, the temporary directory is cleaned up, and the container is removed.
7. The server returns the execution results to the client.

## Security Measures

The Docker execution environment implements several security measures:

- **Resource limits**: CPU, memory, and process limits prevent resource exhaustion attacks.
- **Network isolation**: Containers run without network access to prevent malicious network connections.
- **Filesystem isolation**: Each execution runs in its own isolated container with no access to the host filesystem.
- **User isolation**: Code runs as a non-root user inside the container.
- **Execution timeouts**: Each execution has a strict time limit to prevent infinite loops.
- **Process limits**: Limited number of processes to prevent fork bombs.
- **No new privileges**: Containers run with no ability to gain additional privileges.

## Supported Languages and Configurations

| Language   | File Extension | Compile Command | Execute Command | Timeout (seconds) |
|------------|---------------|-----------------|----------------|-------------------|
| JavaScript | .js           | -               | node           | 10                |
| TypeScript | .ts           | tsc             | node           | 10                |
| Python     | .py           | -               | python3        | 10                |
| Java       | .java         | javac           | java           | 15                |
| C++        | .cpp          | g++             | ./solution     | 10                |
| C          | .c            | gcc             | ./solution     | 10                |
| Go         | .go           | go build        | ./solution     | 10                |
| Rust       | .rs           | rustc           | ./solution     | 10                |
| Ruby       | .rb           | -               | ruby           | 10                |

## Maintenance

### Updating the Sandbox Image

If you need to add support for new languages or modify existing configurations:

1. Update the `Dockerfile.sandbox` file
2. Rebuild the image: `npm run docker:build-sandbox`

### Cleaning Up

To stop all containers and networks:
```
npm run docker:down
```

### Troubleshooting

If you experience issues with code execution:

1. Check Docker logs: `npm run docker:logs`
2. Verify that the code execution sandbox image exists: `docker images | grep code-execution-sandbox`
3. Check your Docker installation: `docker info`

## Extending the Environment

To add support for additional languages:

1. Add the language configuration in `src/lib/dockerExecutor.ts`
2. Install the required dependencies in `Dockerfile.sandbox`
3. Create an execution script for the language
4. Rebuild the sandbox image