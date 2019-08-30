   
   module.exports = {
     entry: __dirname + '/client/src/game.js',
     module: {
       rules: [{
         test: [/\.js$/],
         exclude: /node_modules/,
         use: {
           loader: 'babel-loader',
           options: {
             presets: ['@babel/preset-env']
           }
         }
       }]
     },
     output: {
       filename: 'bundle.js',
       path: __dirname + '/public/js'
     }
   };