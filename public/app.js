// Whenever someone clicks article notes button
$(document).on("click", "#addnote", function () {

  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
    // With that done, add the note information to the page
    .then(function (data) {
      console.log(data);

      // If there's a note in the article
      if (data.note) {
        $("#bodyinput" + thisId).val(data.note.body);
        //$("#savenote").html('Update Note');
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  var notebody = $("#bodyinput" + thisId).val();

  console.log("this is notebody: " + notebody);
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        // Value taken from note textarea
        body: notebody
      }
    })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#bodyinput").empty();
    });

});