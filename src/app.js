"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Movie = require("./entity/movie");
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
    });
    app.use(session({
        secret: "AS20$%loj",
        resave: false,
        saveUninitialized: false,
        store: store,
    }));
    const isAuth = (req, res, next) => {
        if (req.session.isAuth) {
            next();
        }
        else {
            return res.status(401).send('You are not authorized to delete or edit');
        }
    };
    // create movie
    app.post('/api/movie/create', function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const checkExist = yield Movie.findOne({ movie_name: req.body.movie_name });
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
            movie.release_date = moment_1.default(req.body.release_date).format('YYYY-MM-DD HH:mm:ss');
            const saveMovie = yield Movie.save(movie);
            if (saveMovie) {
                const successResponse = {
                    status: 1,
                    message: 'Successfully created Movie',
                };
                return res.status(200).send(successResponse);
            }
            else {
                const errResponse = {
                    status: 0,
                    message: 'Unable to create movie',
                };
                return res.status(400).send(errResponse);
            }
        });
    });
    // edit movie
    app.put('/api/movie/edit-movie/:id', isAuth, function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const movie = yield Movie.findOne({
                id: req.params.id,
            });
            if (!movie) {
                const errResponse = {
                    status: 0,
                    message: 'Invalid movie id',
                };
                return res.status(400).send(errResponse);
            }
            const checkExist = yield Movie.findOne({
                where: { id: typeorm_1.Not(req.params.id), movie_name: req.body.movie_name }
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
            movie.release_date = req.body.release_date ? moment_1.default(req.body.release_date).format('YYYY-MM-DD HH:mm:ss') : movie.release_date;
            const saveMovie = yield Movie.save(movie);
            if (saveMovie) {
                const successResponse = {
                    status: 1,
                    message: 'Successfully edited Movie',
                };
                return res.status(200).send(successResponse);
            }
            else {
                const errResponse = {
                    status: 0,
                    message: 'Unable to edit ovie',
                };
                return res.status(400).send(errResponse);
            }
        });
    });
    // delete movie (soft delete)
    app.delete('/api/movie/delete-movie/:id', isAuth, function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Inside route');
            /*
             Input format
             // route param
             id -> movieId
            */
            // cookkie save
            req.session.isAuth = true;
            const movie = yield Movie.findOne({
                id: req.params.id,
            });
            if (!movie) {
                const errResponse = {
                    status: 0,
                    message: 'Invalid movie id',
                };
                return res.status(400).send(errResponse);
            }
            const deleteMovie = yield Movie.deleteOne(movie);
            if (deleteMovie) {
                // remove session
                req.session.destroy((err) => {
                    if (err)
                        throw err;
                });
                const successResponse = {
                    status: 1,
                    message: 'Successfully deleted Movie',
                };
                return res.status(200).send(successResponse);
            }
            else {
                const errResponse = {
                    status: 0,
                    message: 'Unable to delete Movie',
                };
                return res.status(400).send(errResponse);
            }
        });
    });
    // movie list
    app.get('/api/movie/movie-list', function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Inside route');
            const movie = yield Movie.find({});
            if (movie.length > 0) {
                const successResponse = {
                    status: 1,
                    message: 'Successfully got movie list',
                    data: movie,
                };
                return res.status(200).send(successResponse);
            }
            else {
                const errResponse = {
                    status: 0,
                    message: 'No data found',
                };
                return res.status(400).send(errResponse);
            }
        });
    });
    // movie detail
    app.get('/api/movie/movie-detail/:id', function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Inside route');
            /*
            Input format
            // route param
              id -> movierId
           */
            const movie = yield Movie.findOne({
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
    });
    app.listen(PORT, function (err) {
        if (err)
            console.log(err);
        console.log("Server listening on PORT", PORT);
    });
})
    .catch((error) => console.log(error));
