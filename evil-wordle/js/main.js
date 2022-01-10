var guesses = [];
var guess_sts = [];
var has_won = false;
var validwords = [];
var my_word = "";
var words_common = words_common_5;
var words_all = words_all_5;
var win_string = '22222';
var is_evil = true;
var options_shown = false;
var is_timed = false;
var start_time = 0;
var timer_id = 0;
var time_elapsed = 0;

// options state
var word_length = 5;

// init keyboard
var init_keyboard = function() {
  var keys = [
    'QWERTYUIOP',
    'ASDFGHJKL',
    'ZXCVBNM'
  ];
  for(var i = 0; i < keys.length; i++) {
    var row = keys[i];
    for(var j = 0; j < row.length; j++) {
      var cur_char = row.charAt(j);
      $("#keyboard_row" + i).append( "<span class='key' id='key_" + cur_char + "'>" + cur_char + "</span>" );
    }
  }
};

// toggle word length
var change_options = function() {
  word_length = parseInt($('input[name="word_length"]:checked').val());
  is_evil = $('input[name="is_evil"]:checked').val() === "yes";
  is_timed = $('input[name="game_mode"]:checked').val() === "timed";
};

var start_timer = function() {
  start_time = Date.now();
  timer_id = setInterval(update_timer, 29);
};

var stop_timer = function() {
  clearInterval(timer_id);
};

var update_timer = function() {
  if(start_time === 0) {
    $("#timer-display").text("--");
  }
  else {
    time_elapsed = Math.round(((Date.now() - start_time) / 1000.0 + Number.EPSILON) * 100) / 100;
    $("#timer-display").text(time_elapsed + " sec");
  }
};

var toggle_options = function(to_show) {
  options_shown = to_show;
  if(options_shown) {
    $("#options_container").show();
    $(this).html("Options &#x25BC;");
  }
  else {
    $("#options_container").hide();
    $(this).html("Options &#x25B6;");
  }
};

// init variables and canvas
var reset_canvas = function() {
  // set options
  change_options();

  // set dictionary
  if(word_length === 6) {
    words_common = words_common_6;
    words_all = words_all_6;
  }
  else {
    words_common = words_common_5;
    words_all = words_all_5;
  }

  // toggle timer
  if(is_timed) {
    $("#keyboard_container").addClass("timer_active");
  }
  else {
    $("#keyboard_container").removeClass("timer_active");
  }

  // reset keyboard
  $(".key").removeClass("selected");
  $(".key").removeClass("contained");
  $(".key").removeClass("correct");

  // reset state
  guesses = [];
  guess_sts = [];
  has_won = false;
  start_time = 0;
  if(timer_id >= 0) {
    clearInterval(timer_id);
  }
  timer_id = -1;

  // copy main word list
  if(is_evil) {
    validwords = [];
    my_word = "";
    for (i = 0; i < words_common.length; i++) {
      validwords[i] = words_common[i];
    }
  }
  else {
    my_word = words_common[Math.floor(Math.random()*words_common.length)];
    validwords = [my_word];
  }

  win_string = '2'.repeat(word_length);

  $("#warning").empty();
  $("#victory").empty();
  $("#wordlist").empty();
  $("#share_button").show()
  $("#share_note").hide();
  $("#victory_container").hide();
  $("#guess_form_container").show();
  $("#guess").attr("placeholder", word_length + " letters");
  $("#timer-display").text("--");
};

$( document ).ready(function() {
  $("#guess").focus();
  init_keyboard();
  reset_canvas();

  var check_valid_guess = function(guess) {
    return guess.length === word_length && /^[a-z]+$/.test(guess) && (words_common.includes(guess) || words_all.includes(guess));
  };

  var setCharAt = function(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
  }

  var mode = function(array) {
    if(array.length == 0) return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
      var el = array[i];
      if(modeMap[el] == null)
        modeMap[el] = 1;
      else
        modeMap[el]++;  
      if(modeMap[el] > maxCount)
      {
        maxEl = el;
        maxCount = modeMap[el];
      }
    }
    return maxEl;
  }


  var compare_guess_score = function (guess, matchword) {
    var score = 0;
    var score_st = '';

    var found_letters = '';
    var misplaced_letters = '';
    var matches = {};
    var recheck = false;

    for (var i = 0; i < word_length; i++) {
      var cur_char = guess.charAt(i);
      if (matchword.indexOf(cur_char) === -1) {
        score_st += '0';
      }
      else if (cur_char === matchword.charAt(i)) {
        score += 2;
        score_st += '2';
        found_letters += cur_char;
        if(cur_char in matches) {
          matches[cur_char]++;
        }
        else {
          matches[cur_char] = 1;
        }
      }
      else {
        // TODO: redundant logic with below
        var occurences_guess = (guess.split(cur_char).length - 1);
        var occurences_matchword = (matchword.split(cur_char).length - 1);

        if(occurences_guess <= occurences_matchword) {
          score += 1;
          score_st += '1';
        }
        else {
          misplaced_letters += cur_char;
          score_st += '_';
          recheck = true;
        }
      }
    }

    if(recheck) {
      for (var i = 0; i < word_length; i++) {
        if(score_st.charAt(i) === '_') {
          var cur_char = guess.charAt(i);
          // TODO: this if statement is redundant with _?
          if (matchword.indexOf(cur_char) > -1 && cur_char !== matchword.charAt(i)) {
            var occurences_matchword = (matchword.split(cur_char).length - 1);
            if(!(cur_char in matches)) {
              matches[cur_char] = 0;
            }
            if(matches[cur_char] >= occurences_matchword) {
              score_st = setCharAt(score_st, i, '0');
            }
            else {
              score += 1;
              matches[cur_char]++;
              score_st = setCharAt(score_st, i, '1');
            }
          }
        }
      }
    }
    return [score, score_st];
  };

  var compare_all_scores = function(guess, list) {
    var scores = [];
    var score_sts = [];
    for (var i = 0; i < list.length; i++) {
      var comp = compare_guess_score(guess, list[i]);
      scores.push(comp[0]);
      score_sts.push(comp[1]);
    }

    // find the non-min pattern with the most - i think this is more evil?
    var min_score = Math.min(...scores);
    var min_sts = score_sts.filter(function(st) { return st !== win_string; });
    var match_st = '';
    if(min_sts.length === 0) {
      match_st = win_string;
    }
    else {
      match_st = mode(min_sts);
    }

    // filter down only to words that fit the clues given
    var final_list = [];
    for(var i = 0; i < list.length; i++) {
      if(score_sts[i] === match_st) {
        final_list.push(list[i]);
      }
    }
    console.log(final_list); // TODO: remove

    return final_list;
  }

  var compare_guess = function (guess, matchword, i) {
    var cur_char = guess.charAt(i);
    if (matchword.indexOf(cur_char) === -1) {
      return '';
    }
    else if (cur_char === matchword.charAt(i)) {
      return 'correct';
    }
    else {
      return 'contained';
    }
  };

  $("#guess_form").submit(function(e) {
    if(options_shown) { toggle_options(false); }
    if(has_won) {
      e.preventDefault();
      return;
    }
    $("#warning").empty();
    var guess = $("#guess").val().toLowerCase();
    if(!check_valid_guess(guess)) {
      $("#warning").text("Invalid guess. Must be " + word_length + "-letter long real English word.");
    }
    else {
      if(guesses.length === 0) {
        start_timer();
      }
      guesses.push(guess);
      $('#guess').val("");

      validwords = compare_all_scores(guess, validwords);
      var word = validwords[0];
      var comp_st = compare_guess_score(guess, word)[1];
      guess_sts.push(comp_st);

      // add new row to displayed list
      var html_to_add = '<div class="row">';
      for (var i = 0; i < guess.length; i++) {
        var guess_class = '';
        var guess_char = guess.charAt(i).toUpperCase();
        $("#key_" + guess_char).addClass("selected");
        if(comp_st.charAt(i) === '1') {
          guess_class = 'contained';
          $("#key_" + guess_char).addClass("contained");
        }
        else if(comp_st.charAt(i) === '2') {
          guess_class = 'correct';
          $("#key_" + guess_char).addClass("correct");
        }
        html_to_add += '<div class="letterbtn ' + guess_class + '">';
        html_to_add += guess_char;
        html_to_add += '</div>';

      }
      html_to_add += '</div>';

      $("#wordlist").append(html_to_add);
      $("#wordlist").animate({ scrollTop: $('#wordlist').prop("scrollHeight")}, 1000);

      if(comp_st === win_string) {
        stop_timer();
        var guesses_str = guesses.length === 1 ? "guess" : "guesses"
        $("#victory").text("You won in " + guesses.length + " " + guesses_str + "!");
        $("#victory_container").show();
        $("#guess_form_container").hide();
        has_won = true;
      }
    }
    e.preventDefault();
  });

  $("#how").click(function(e) {
    $("#howitworks").show();
  });

  var generate_share = function() {
    if(my_word === "") {
      my_word = validwords[0];
    }
    var share = "Evil Wordle: \"" + my_word + "\". "
    if(has_won) {
      share += "I won after "
    }
    else {
      share += "I gave up after "
    }
    if(is_timed) {
      share += time_elapsed + " seconds and ";
    }
    var guesses_str = guesses.length === 1 ? "guess" : "guesses"
    share += guesses.length + " " + guesses_str + "\n\n"
    for(var i = 0; i < guess_sts.length; i++) {
      var cur_st = guess_sts[i];
      var symbols = '';
      for(var j = 0; j < word_length; j++) {
        if(cur_st.charAt(j) === '0') {
          symbols += '⬜';
        }
        else if(cur_st.charAt(j) === '1') {
          symbols += '🟨';
        }
        else {
          symbols += '🟩';
        }
      }
      share += symbols + '\n';
    }
    share += '\n\nhttps://swag.github.io/evil-wordle/';
    copyToClipboard(share);
    return share;
  }

  $("#guess_form_giveup").click(function(e) {
    my_word = validwords[Math.floor(Math.random()*validwords.length)];
    stop_timer();
    $("#victory").text("I was thinking of \"" + my_word + "\". You lose!");
    $("#victory_container").show();
    $("#warning").empty();
    $("#guess_form_container").hide();
  })

  function copyToClipboard(text) {
    var sampleTextarea = document.createElement("textarea");
    document.body.appendChild(sampleTextarea);
    sampleTextarea.value = text; //save main text in it
    sampleTextarea.select(); //select textarea
    document.execCommand("copy");
    document.body.removeChild(sampleTextarea);
  }

  $(".reset").click(function(e) {
    reset_canvas();
  });

  $("#share_button").click(function(e) {
    var share = generate_share();
    $("#share_button").hide()
    $("#share_note").show();
  });

  $("form#options_form :input").change(function() {
    reset_canvas();
  });

  $("#options_toggle").click(function(e) {
    toggle_options(!options_shown);
  });
});


