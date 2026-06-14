#! /bin/bash

ssh my-websites << EOF
  cd /root/projects
  git pull
  systemctl restart projects-admin.service
EOF

