web:    cross-env SKIP_PREFLIGHT_CHECK=true react-scripts start --color
server: cross-env NODE_ENV=development nodemon --config $root/nodemon.json --exec babel-node src -- --config-file=$root/babel.config.js --no-babelrc --require $(npm explore universal-dotenv -- pwd)
