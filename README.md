# Space Defender

### Can't wait?
Then play it **NOW** on AWS <a target="_blank" href="http://ec2-18-144-6-83.us-west-1.compute.amazonaws.com/">Space Defender</a>

> A take on the classic "old school" Arcade game Space Invader's
> The game has multiple levels with the Alien's getting smarter 
> and more numerous as the levels increase. You receive points for 
> every Alien ship you destroy but each shot also cost you points.
> When there are a few Alien's left they start tracking you and shooting
> directly at you. You can visualize the screen as 360 globe. Use the
> arrow keys to move UP, DOWN, LEFT, and RIGHT. Press the Spacebar to fire.
> To pause the game just click out side the game or press the key 'p'.
> To go into Hyperspace hit the 's' key but be careful you don't
> know where you will come back on the screen and it might be on top of an alien
> vessel if so boom your ship is destroyed. In a pinch you can also move
> your spaceship to the bottom center of the screen (the starting position) with
> the press of the 'c' key. This is much safer than going into hyperspace
> but may not get you out of trouble.
>
> The game now features up to 8 ships 3 initially and 1 each for each level
> completed up to 8 total. There is now a scoreboard for the total number of ships the player
> has left and the current level the player is on.
> Once the game is completed you have the option to provide your score.
> If it is in the top 10 it will displayed on the toast.
>
> Enjoy!!!
## Table of Contents

1. [Usage](#Usage)
1. [Requirements](#requirements)
1. [Development](#development)
1. [API](#API)

## Usage

`localhost:9009` or what ever port you decide to set the server up on.
This version requires that an Node/Express server be set up and running.
If you do no know how to do this then go ahead read the doc's.

#### Game Controls
1. **LEFT**, **RIGHT**, **UP**, & **DOWN** Arrow key to move your ship
2. **Spacebar** - to fire
3. **p** - Pauses the game
4. **s** - Go into hyper-space -- <span style="color:red">dangerous!!!</span>
5. **c** - Move your ship back to the center -- <span style="color:orange">safe</span>!

## Requirements
### OS
- Mac OSX Mojave 10.14 or greater [Tested]
- AWS Linux Ubuntu 18.04 (Tested and currently hosted on AWS) <a target="_blank" href="http://ec2-18-144-6-83.us-west-1.compute.amazonaws.com/">here</a>.
- Linux - Should be good on any modern distribution (Tested on Ubuntu 18.04 & 20.04)
- Windows 7/8/10+ [Untested]
- Windows 10+ w/bash shell & Linux subsystem [Untested]

### Software
- Node 6.13.0 or greater
- Mongo 4.03 or higher

## Development

### Installing Dependencies

From within the root directory, clone this repo, and install the npm modules with:
```sh
npm install
```
If you want you can install webpack even globally if that is your thing. If not just make sure it is installed it should be by default.
```sh
npm install -g webpack
```
Up next we can get our webpack builder, bundler and file watcher up and running with the command:
```sh
npm run build
```
Whenever you make changes to the file `game.js` webpack will rebuild the file as `bundle.js`. You should see the console output `webpack is watching the files…` and some other output scroll across the screen. Check the output and make sure there are no errors.

Next up if you do not have it already installed, install and start MongoDB. How to do this is beyond the scope of this README. There are numerous resources available on how to install MongoDB. If Mongo is not already running as daemon then you will have to start Mongo up with:
```sh
mongod [--dbpath data/db] # You probably will not need to specify the path to the  database
```
If you have to create the database directory with the command:
```sh
mkdir -p data/db
```

Start mongo from the parent directory of data. You should see `mongo` start up on port `27017`.
Mongo has a shell that you can use to make queries on the database. You can start it up with:

```sh
mongo
```
You should then see the `mongo` shell prompt a `>`. This is a completely optional step and can be skipped. But does give the you an extra view into what the database is up to.

Once you have MongoDB up and running then we can go ahead and start the node server. You have two options.
1. `npm start` will start the sever on `port 9009` by default but you will have to restart it if you make any changes to the node server `space_defender.js` or related files.
2. `nodemon run space_defender.js` will start the sever on `port 9009` by default and the node server **WILL** restart every time you save changes. Nodemon is watching the files for you.

Next up start up you web browser (Google Chrome) and point it to port `localhost:9009` or what ever port you have set the node server `space_defender.js` to. You should see the games start up splash screen. If not check Chrome's Developer tools console for any potential errors. 

### Have some fun.

## API
No API defined Reserved for future use.

