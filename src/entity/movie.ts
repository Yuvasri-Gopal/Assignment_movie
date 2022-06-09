const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const movieSchema = new Schema({
  movie_name: {
    type: String,
    required: true,
  },
  rating: {
    type: String,
    required: true,
  },
  cast: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  release_date: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('movie', movieSchema);