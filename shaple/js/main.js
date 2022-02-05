var colors_list = [
  [1,2,3,4,5,6],
  [4,5,6,7,8,9],
  [3,5,7,9,10,14],
  [2,11,12,13,3,5],
  [13,4,5,7,2,8],
  [1,2,4,8,9,11],
  [2,5,11,3,8,9],
  [14,3,6,10,9,8],
  [4,5,7,9,11,14],
  [1,2,10,5,2,3]
];

var start_index = 0;

var correct_guess = 0;
var score = 0;
var guesses = 0;

let max_guesses = 5;
var start = 0;
var time_elapsed = 0;

var guess_log = [];

var shuffle = function(array) {
  let currentIndex = array.length,  randomIndex;

  var arrayCopy = [...array];

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [arrayCopy[currentIndex], arrayCopy[randomIndex]] = [
      arrayCopy[randomIndex], arrayCopy[currentIndex]];
  }

  return arrayCopy;
}

var compare_scalar_arrays = function(array1, array2) {
  return array1.length === array2.length && array1.every(function(value, index) { return value === array2[index]});
}

var append_colors = function(color_list, cube) {
  $("." + cube + " .top").addClass("color-" + color_list[0]);
  $("." + cube + " .bottom").addClass("color-" + color_list[1]);
  $("." + cube + " .left").addClass("color-" + color_list[2]);
  $("." + cube + " .right").addClass("color-" + color_list[3]);
  $("." + cube + " .front").addClass("color-" + color_list[4]);
  $("." + cube + " .back").addClass("color-" + color_list[5]);
}

var randomize = function() {
  var cur_index = start_index + guesses;

  // apply random colors
  var colors = colors_list[cur_index % colors_list.length];

  var colors_main = shuffle(colors);
  var colors_wrong_1 = shuffle(colors);
  var colors_wrong_2 = shuffle(colors);

  while(compare_scalar_arrays(colors_main, colors_wrong_2)) {
    colors_wrong_1 = shuffle(colors);
  }

  while(compare_scalar_arrays(colors_main, colors_wrong_2)) {
    colors_wrong_2 = shuffle(colors);
  }

  var sub_index_1 = Math.floor(Math.random() * 6) + 1;
  var sub_index_2 = Math.floor(Math.random() * 6) + 1;
  var sub_index_3 = Math.floor(Math.random() * 6) + 1;

  colors_wrong_1[sub_index_1] = colors_list[(cur_index+1) % colors_list.length][sub_index_1];
  colors_wrong_1[sub_index_2] = colors_list[(cur_index+1) % colors_list.length][sub_index_2];
  colors_wrong_1[sub_index_3] = colors_list[(cur_index+1) % colors_list.length][sub_index_3];
  colors_wrong_2[sub_index_1] = colors_list[(cur_index+1) % colors_list.length][sub_index_1];
  colors_wrong_2[sub_index_2] = colors_list[(cur_index+1) % colors_list.length][sub_index_2];

  correct_guess = Math.floor(Math.random() * 3) + 1;
  var wrong_guess_1, wrong_guess_2;
  if(correct_guess === 1) {
    wrong_guess_1 = "choice-2";
    wrong_guess_2 = "choice-3";
  }
  else if(correct_guess === 2) {
    wrong_guess_1 = "choice-1";
    wrong_guess_2 = "choice-3";
  }
  else {
    wrong_guess_1 = "choice-1";
    wrong_guess_2 = "choice-2";
  }
  var correct_guess_class = "choice-" + correct_guess;

  $(".face").removeClass("color-1 color-2 color-3 color-4 color-5 color-6 color-7 color-8 color-9 color-10 color-11 color-12 color-13 color-14");
  append_colors(colors_main, "main-cube");
  append_colors(colors_main, correct_guess_class);
  append_colors(colors_wrong_1, wrong_guess_1);
  append_colors(colors_wrong_2, wrong_guess_2);

  // apply random turns
  $(".cube").removeClass("turn-1 turn-2 turn-3 turn-4");
  var turn_order = shuffle(["main-cube", "choice-1",  "choice-2",  "choice-3"]);
  $("." + turn_order[0]).addClass("turn-1");
  $("." + turn_order[1]).addClass("turn-2");
  $("." + turn_order[2]).addClass("turn-3");
  $("." + turn_order[3]).addClass("turn-4");
}

var end_game = function() {
  time_elapsed = Math.round((Date.now() - start)/100)/10
  if(time_elapsed > 10) { time_elapsed = Math.round(time_elapsed) };
  $("#endgame").show();
  $("#time_elapsed").text("" + time_elapsed)
  $("#game-container").hide();
  $("#finalscore").text("" + score);
  if(score === max_guesses) {
    $("#scoremessage").text("Amazing. Perfect cubelord status.");
  }
  else if(score === max_guesses-1) {
    $("#scoremessage").text("Close to perfection. Approaching shapechad.");
  }
  else if(score > max_guesses * 0.333) {
    $("#scoremessage").text("Nice rotating, rotator.");
  }
  else if(score === 0) {
    $("#scoremessage").text("Big oof");
  }
  else {
    $("#scoremessage").text("Oof...Worse than random chance.");
  }
};

var copyToClipboard = function(text) {
  var sampleTextarea = document.createElement("textarea");
  document.body.appendChild(sampleTextarea);
  sampleTextarea.value = text; //save main text in it
  sampleTextarea.select(); //select textarea contenrs
  document.execCommand("copy");
  document.body.removeChild(sampleTextarea);
}

var generate_share = function() {
  var share = "I played Shaple and rotated " + score + " out of " + max_guesses + " shapes correctly in " + time_elapsed + " seconds."
  share += "\n\n";
  for(var i = 0; i < guess_log.length; i++) {
    var cur_log = guess_log[i];
    if(guess_log[i] === 0) {
      share += '⬜';
    }
    else {
      share += '🟩';
    }
  }
  share += '\n\nhttps://swag.github.io/shaple/';
  copyToClipboard(share);
  return share;
}

var reset = function() {
  correct_guess = 0;
  score = 0;
  guesses = 0;
  start_index = Math.floor(Math.random() * 10);
  $("#endgame").hide();
  $("#game-container").show();
  $("#status").html("Choose the shape that matches.<br/>" + max_guesses + " shapes left.");
  $("#share_msg").hide();
  $("#share_button").show();
  start = Date.now();
  randomize();
};

$("#share_button").click(function(e) {
  var share = generate_share();
  $("#share_msg").show();
  $("#share_button").hide();
});


$(".choice-cube").click(function(e) {
  var current_guess = parseInt($(this).data("guess"));
  guesses++;
  var status = "wrong";
  if(current_guess === correct_guess) {
    score++;
    status = "correct"
    guess_log.push(1);
  }
  else {
    guess_log.push(0);
  }
  var remaining_guesses = max_guesses - guesses;
  $("#status").html(status + ". " + score + " / " + guesses + "<br/>" + remaining_guesses + " shapes left.");

  if(guesses >= max_guesses) {
    end_game();
  }
  else {
    randomize();
  }
})

$("#replay").click(function(e) {
  reset();
})

// start game
$( document ).ready(function() {
  reset();
});