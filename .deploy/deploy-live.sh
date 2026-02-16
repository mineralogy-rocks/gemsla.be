#!/usr/bin/env bash
set -e

export COMPOSE_INTERACTIVE_NO_CLI=1

echo 'Changing directory to project repository...'
cd /home/ubuntu/webapp/gemsla.be/.deploy


echo 'Pulling latest source code...'
git pull


echo 'Tagging current latest image with `prev` tag...'
docker tag registry.gitlab.com/mineralogy.rocks/gemsla.be/frontend:latest registry.gitlab.com/mineralogy-rocks/gemsla.be/frontend:prev


echo 'Pulling new images...'
docker pull registry.gitlab.com/mineralogy.rocks/gemsla.be/frontend:latest


echo 'Removing dangling images...'
docker image prune -f


echo 'Setting cronjobs...'
sudo cp ./crontab/config /etc/cron.d/gemsla.be


echo 'Restarting containers...'
docker compose up -d --no-deps frontend


echo 'Restarting nginx...'
docker compose restart nginx


export COMPOSE_INTERACTIVE_NO_CLI=0