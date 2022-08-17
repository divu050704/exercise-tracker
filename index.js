const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose")
const mongodb = require("mongodb")
const bodyParser = require("body-parser")
require('dotenv').config()

// use the Mongo_uri as a string 
const url = process.env.MONGO_URI

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
mongoose.connect(url, connectionParams)
  .then(() => {
    console.log('Connected to the database ')
  })
  .catch((err) => {
    console.error(`Error connecting to the database. n${err}`);
  })
// Use of cors
app.use(cors())
// body parser for body request
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// Post request for new user
const userSchema = mongoose.Schema({
  username: {
    required: true,
    type: String
  },
  log: {
    type: Array
  }
})
const userModel = new mongoose.model("exercise-tracker", userSchema)
app.post("/api/users/", (req, res) => {
  userModel.create({ username: req.body.username }, function (err, inserted) {
    if (err) res.send(err)
    else res.json({ username: inserted.username, _id: (inserted._id).toString() })
  })
})

app.get("/api/users/", (req, res) => {
  userModel.find({}, (err, found) => {
    if (err) res.send(err)
    else res.send(found)
  })
})


app.post("/api/users/:_id/exercises/", (req, res) => {
  let id = req.body[":_id"] || req.params._id
  let today;
  if (!req.body.date) {
    var a = new Date();
    var year = (a.getFullYear())
    var month = ("0" + (a.getMonth() + 1)).slice(-2);
    var date = ("0" + a.getDate()).slice(-2);
    today = new Date(year + "-" + month + "-" + date)

  }
  else {
    today = new Date(req.body.date)

  }
  const dataUpdate = { log: { description: req.body.description, duration: parseInt(req.body.duration), date: today } }
  userModel.findOneAndUpdate({ _id: id }, { $push: dataUpdate }, { returnOriginal: false }, (err, data) => {
    if (err) console.log(err)
    else {
      res.json({ _id: id, username: data.username, date: today.toDateString(), duration: parseInt(req.body.duration), description: req.body.description })
    }
  })
})

app.get("/api/users/:id/logs", (req, res) => {


  if (req.query.from && req.query.to) {

    let from = new Date(req.query.from)

    let to = new Date(req.query.to)

    userModel.findOne({ _id: req.params.id }, (err, found) => {
      if (err) console.log(err)
      const logs = found.log
      const logArray = []

      for (i = 0; i < logs.length; i++) {
        if (logs[i].date >= from && logs[i].date <= to) {
          logArray.push({
            description: logs[i].description,
            duration: logs[i].duration,
            date: (logs[i].date).toDateString(),
          })

        }
      }
      res.json({ _id: found._id, username: found.username, from: from.toDateString(), to: to.toDateString(), count: logArray.length, log:  (req.query.limit ? logArray.slice(0, req.query.limit + 1) : logArray) })

    })
  }
  else if (req.query.from) {

    let from = new Date(req.query.from)
    userModel.findOne({ _id: req.params.id }, (err, found) => {
      if (err) console.log(err)
      const logs = found.log
      const logArray = []

      for (i = 0; i < logs.length; i++) {
        if (logs[i].date >= from) {
          logArray.push({
            description: logs[i].description,
            duration: logs[i].duration,
            date: (logs[i].date).toDateString()
          })
        }
      }
      res.json({ _id: found._id, username: found.username, from: from.toDateString(), count: logArray.length, log:  (req.query.limit ? logArray.slice(0, req.query.limit + 1) : logArray) })
    })
  }
  else if (req.query.to) {

    let to = new Date(req.query.to)
    userModel.findOne({ _id: req.params.id }, (err, found) => {
      if (err) console.log(err)
      const logs = found.log
      const logArray = []

      for (i = 0; i < logs.length; i++) {

        if (logs[i].date <= to) {
          logArray.push({
            description: logs[i].description,
            duration: logs[i].duration,
            date: (logs[i].date).toDateString()
          })
        }
      }
      res.json({ _id: found._id, username: found.username, to: to.toDateString(), count: logArray.length, log:  (req.query.limit ? logArray.slice(0, req.query.limit + 1) : logArray) })
    })
  }
  else if (req.query.limit) {

   
    userModel.findOne({ _id: req.params.id }, (err, found) => {
      if (err) console.log(err)
      const logs = found.log
      const logArray = []
      for (i = 0; i < req.query.limit; i++) {
        logArray.push({
          description: logs[i].description,
          duration: logs[i].duration,
          date: (logs[i].date).toDateString()
        })
      }
      res.json({ _id: found._id, username: found.username, count: logArray.length, log:  (req.query.limit ? logArray.slice(0, req.query.limit + 1) : logArray),  })

    })
  }
  else {
    userModel.findOne({ _id: req.params.id }, (err, found) => {
      if (err) console.log(err)
      const logs = found.log
      const logArray = []
      for (i = 0; i < logs.length; i++) {
        logArray.push({
          description: logs[i].description,
          duration: logs[i].duration,
          date: (logs[i].date).toDateString()
        })
      }
     
      res.json({ _id: found._id, username: found.username, count: logArray.length, log:  (req.query.limit ? logArray.slice(0, req.query.limit + 1) : logArray) })
    })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
