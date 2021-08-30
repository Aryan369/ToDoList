const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const url = "mongodb://localhost:27017/todolistDB";

mongoose.connect(url, {useNewUrlParser: true});

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

//Default Items
const item1 = new Item({
  name: "Welcome"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete the item."
});
const defaultItems = [item1, item2, item3];


//List Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);


//Routes

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  if(List.findOne({name: customListName}, (err, foundList) => {
    if(!err){
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();

        res.render("list", {listTitle: list.name, newListItems: list.items});
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  }));
});

app.get("/", function(req, res) {
  Item.find({}, (err, foundItems) => {
      if(foundItems.length === 0){
        Item.insertMany(defaultItems, (err) => {
          if(!err){
            console.log("Successfully saved items to the Database.");
            res.redirect("/");
          }
          else{
            console.log(err);
          }
        });
      }
      else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (req.body.list === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (req.body.list === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if(!err){
        console.log("Deleted Succesfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}},(err, foundList) => {
      if(!err){
        res.redirect(`/${listName}`);
      }
    });
  }
});

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}`);
});
