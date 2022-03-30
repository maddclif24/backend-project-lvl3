install:
	npm install
lint:
	npx eslint .
test:
	NODE_OPTIONS=--experimental-vm-modules npx jest
run:
	page-loader https://page-loader.hexlet.repl.co/