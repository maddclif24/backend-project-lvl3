install:
	npm install
lint:
	npx eslint .
test:
	NODE_OPTIONS=--experimental-vm-modules npx jest
test-coverage:
	npm test -- --coverage --coverageProvider=v8
publish:
	npm publish
hex:
	page-loader https://page-loader.hexlet.repl.co/
debug:
	DEBUG=axios page-loader https://page-loader.hexlet.repl.co/
lyr:
	page-loader https://en.lyrsense.com/big_time_rush/listen/3786