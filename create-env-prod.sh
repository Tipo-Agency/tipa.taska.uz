#!/usr/bin/expect -f
set timeout 30
spawn ssh root@46.19.64.193
expect "password:"
send "h-aY4G,WGeV1ws\r"
expect "# "
send "cd /var/www/taska\r"
expect "# "
send "echo 'VITE_FIREBASE_DB_URL=https://tipa-task-manager-default-rtdb.europe-west1.firebasedatabase.app/' > .env.local\r"
expect "# "
send "cat .env.local\r"
expect "# "
send "exit\r"
expect eof

