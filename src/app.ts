import moment from "moment";
import "reflect-metadata"
import { Not } from "typeorm"
const Movie = require("./entity/movie");
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose')
const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// db connection
// const AppDataSource = new DataSource({
//   type: "mongodb",
//   host: "localhost",
//   port: 27017,
//   database: "test",
//   synchronize: true,
//   logging: false,
//   entities: [
//     "src/entity/**/*.ts"
//   ],
// })

// AppDataSource.initialize()


// db connection
const mongoURI = "mongodb://localhost:27017/movie_db";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('connected');
  // const movieRepo = AppDataSource.getMongoRepository(Movie);

  const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'mySession',
  })
  app.use(session({
    secret: "AS20$%loj",
    resave: false,
    saveUninitialized: false,
    store: store,
  }));

  const isAuth = (req: any, res: any, next: any) => {
    if (req.session.isAuth) {
      next();
    } else {
      return res.status(401).send('You are not authorized to delete or edit')
    }
  }

  // create movie
  app.post('/api/movie/create', async function (req: any, res: any) {

    /* Input Format
    // body
    {
      "movie_name": "",
      "rating": "",
      "cast": [],
      "genre": "",
      "release_date": ""
    }
    */
    // cookie save
    req.session.isAuth = true;

    const checkExist = await Movie.findOne({ movie_name: req.body.movie_name });
    if (checkExist) {
      const errResponse = {
        status: 0,
        message: 'Movie already exist, try again with different movie name',
      };
      return res.status(400).send(errResponse);
    }

    const movie = new Movie();
    movie.movie_name = req.body.movie_name;
    movie.rating = req.body.rating;
    movie.cast = req.body.cast;
    movie.genre = req.body.genre;
    movie.release_date = moment(req.body.release_date).format('YYYY-MM-DD HH:mm:ss')

    const saveMovie = await Movie.save(movie);
    if (saveMovie) {
      const successResponse = {
        status: 1,
        message: 'Successfully created Movie',
      };
      return res.status(200).send(successResponse);
    } else {
      const errResponse = {
        status: 0,
        message: 'Unable to create movie',
      };
      return res.status(400).send(errResponse);
    }
  });

  // edit movie
  app.put('/api/movie/edit-movie/:id', isAuth, async function (req: any, res: any) {
    console.log('Inside route');
    /* Input Format
    // route param
      id -> movieId
    // body
    {
      "movie_name": "",
      "rating": "",
      "cast": [],
      "genre": "",
      "release_date": ""
    }
    */
    const movie: any = await Movie.findOne({
      id: req.params.id,
    });
    if (!movie) {
      const errResponse = {
        status: 0,
        message: 'Invalid movie id',
      };
      return res.status(400).send(errResponse);
    }
    const checkExist = await Movie.findOne({
      where: { id: Not(req.params.id), movie_name: req.body.movie_name }
    });
    if (checkExist) {
      const errResponse = {
        status: 0,
        message: 'Movie already exist',
      };
      return res.status(400).send(errResponse);
    }

    movie.movie_name = req.body.movie_name ? req.body.movie_name : movie.movie_name;
    movie.rating = req.body.rating ? req.body.rating : movie.rating;
    movie.cast = (req.body.cast).length > 0 ? req.body.cast : movie.cast;
    movie.genre = req.body.genre ? req.body.genre : movie.genre;
    movie.release_date = req.body.release_date ? moment(req.body.release_date).format('YYYY-MM-DD HH:mm:ss') : movie.release_date;

    const saveMovie = await Movie.save(movie);
    if (saveMovie) {
      const successResponse = {
        status: 1,
        message: 'Successfully edited Movie',
      };
      return res.status(200).send(successResponse);
    } else {
      const errResponse = {
        status: 0,
        message: 'Unable to edit ovie',
      };
      return res.status(400).send(errResponse);
    }
  });

  // delete movie (soft delete)
  app.delete('/api/movie/delete-movie/:id', isAuth, async function (req: any, res: any) {
    console.log('Inside route');
    /* 
     Input format
     // route param
     id -> movieId
    */
    // cookkie save
    req.session.isAuth = true;
    const movie: any = await Movie.findOne({
      id: req.params.id,
    });
    if (!movie) {
      const errResponse = {
        status: 0,
        message: 'Invalid movie id',
      };
      return res.status(400).send(errResponse);
    }

    const deleteMovie = await Movie.deleteOne(movie);
    if (deleteMovie) {
      // remove session
      req.session.destroy((err: any) => {
        if (err) throw err;
      })
      const successResponse = {
        status: 1,
        message: 'Successfully deleted Movie',
      };
      return res.status(200).send(successResponse);
    } else {
      const errResponse = {
        status: 0,
        message: 'Unable to delete Movie',
      };
      return res.status(400).send(errResponse);
    }
  });

  // movie list
  app.get('/api/movie/movie-list', async function (req: any, res: any) {
    console.log('Inside route');

    const movie: any = await Movie.find({});
    if (movie.length > 0) {
      const successResponse = {
        status: 1,
        message: 'Successfully got movie list',
        data: movie,
      };
      return res.status(200).send(successResponse);
    } else {
      const errResponse = {
        status: 0,
        message: 'No data found',
      };
      return res.status(400).send(errResponse);
    }
  });

  // movie detail
  app.get('/api/movie/movie-detail/:id', async function (req: any, res: any) {
    console.log('Inside route');
    /*
    Input format
    // route param
      id -> movierId
   */
    const movie: any = await Movie.findOne({
      id: req.params.id,
    });
    if (!movie) {
      const errResponse = {
        status: 0,
        message: 'Invalid movie id',
      };
      return res.status(400).send(errResponse);
    }
    const successResponse = {
      status: 1,
      message: 'Successfully got movie detail',
      data: movie,
    };
    return res.status(200).send(successResponse);
  });

  app.listen(PORT, function (err: any) {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
  });

})
  .catch((error: any) => console.log(error))
