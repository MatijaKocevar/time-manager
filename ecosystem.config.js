module.exports = {
    apps: [
        {
            name: "time-management-app",
            script: ".next/standalone/server.js",
            cwd: "/home/server/time-management-app",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production",
                HOSTNAME: "0.0.0.0",
                PORT: "3000",
            },
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
        },
    ],
}
