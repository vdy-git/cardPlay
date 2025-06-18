USER = root
HOST = 118.31.36.108
PORT = 22

# 服务器目标目录(只同步public目录 + package.json + package-lock.json + server.js)
TARGET_DIR = /tmp/poker-game
# 私钥
PEM = D:\cardPlay\wdy.pem
# pm2进程名称
PM2_SERVER_NAME = poker-game

# 上传代码
upload:
	# 停止pm2进程
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "source ~/.nvm/nvm.sh; pm2 stop $(PM2_SERVER_NAME) || true"
	# 删除目标目录
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "rm -rf $(TARGET_DIR)"
	# 创建目标目录(public)
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "mkdir -p $(TARGET_DIR)/public"
	# 上传前端代码
	scp -i $(PEM) -P $(PORT) -r public $(USER)@$(HOST):$(TARGET_DIR)/
	# 上传后端代码 + package.json
	scp -i $(PEM) -P $(PORT) package*.json server.js $(USER)@$(HOST):$(TARGET_DIR)/
	# 执行npm install
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "source ~/.nvm/nvm.sh; cd $(TARGET_DIR) && npm install"
	# 使用pm2启动server.js
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "source ~/.nvm/nvm.sh; cd $(TARGET_DIR) && pm2 start server.js --name $(PM2_SERVER_NAME)"
start:
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "source ~/.nvm/nvm.sh; cd $(TARGET_DIR) && pm2 start server.js --name $(PM2_SERVER_NAME)"
stop:
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "source ~/.nvm/nvm.sh; pm2 stop $(PM2_SERVER_NAME) || true"
restart:
	ssh -i $(PEM) -p $(PORT) $(USER)@$(HOST) "source ~/.nvm/nvm.sh; pm2 restart $(PM2_SERVER_NAME) || true"