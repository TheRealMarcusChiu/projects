#! /bin/bash

ssh my-websites << EOF
  cd /root/projects
  git pull --rebase
  systemctl restart projects-admin.service
EOF
