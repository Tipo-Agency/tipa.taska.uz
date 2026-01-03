#!/usr/bin/expect -f
set timeout 30
spawn ssh root@46.19.64.193
expect "password:"
send "h-aY4G,WGeV1ws\r"
expect "# "
send "cd /var/www/taska\r"
expect "# "
send "cat .env.local 2>/dev/null || echo 'Файл .env.local не найден'\r"
expect "# "
send "grep -r 'MOCK_USERS\\|admin\\|ruslan' constants.ts 2>/dev/null | head -5\r"
expect "# "
send "grep -r 'donskikhas' . 2>/dev/null | head -3\r"
expect "# "
send "exit\r"
expect eof

