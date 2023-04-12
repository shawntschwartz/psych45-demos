// ## High-level overview
// Things happen in this order:
// 
// 1. Compute randomization parameters (shuffle words, task order)
// 2. For each 'task':
// 	a. Initialization fills in the template {}} slots and shows the instructions slide.
// 	b. Set up the experiment sequence object.
//	c. When the subject clicks the start button, it calls experiment.next()
//      d. Experiment.next() checks if there are any trials left to do. If there aren't, it pulls up the wait slide.
//      e. Then the retrieval screen appears and participants enter all of the words that they remember
//      f. Their results are then shown to them, and they can respond to the thought questions
//      g. Results for the list are pushed to the results
//      h. If there are more words and manipulations, repeat, otherwise wait 1.5 seconds and submit to Turk


// ## Experimental parameters

// Timing
var stim_time = 2000; //2000
var iti_time = 1000; //1000
var delay_time = 1500;

// Stimuli
var stim_neg = ['mutilate', 'hostage', 'funeral', 'rejected', 'leprosy', 'murderer', 'rabies', 'suffocate', 'torture', 'vomit', 'depression', 'lice', 'seasick', 'slaughter', 'prison'];

var stim_neu = ['broom', 'curtains', 'bumble', 'hairdryer', 'volcano', 'duct', 'coyote', 'fingerprint', 'hammer', 'pecan', 'contents', 'hunter', 'knitting', 'freezer', 'stove'];

var stim_pos = ['paradise', 'love', 'miracle', 'laughter', 'award', 'sweetheart', 'mother', 'cash', 'romantic', 'treasure', 'kiss', 'baby', 'promotion', 'graduate', 'rainbow'];

var stim = stim_neg.concat(stim_neu).concat(stim_pos);

// ## Helper functions

// Get a random integer less than n
// courtesy of L Ouyang
function randomInteger(n) {
	return Math.floor(Math.random()*n);
}

// Fisher Yates algorithm for random shuffling
// source: http://sedition.com/perl/javascript-fy.html
function fisherYates ( myArray ) {
  var i = myArray.length;
  if ( i == 0 ) return false;
  while ( --i ) {
    var j = Math.floor( Math.random() * ( i + 1 ) );
    var tempi = myArray[i];
    var tempj = myArray[j];
    myArray[i] = tempj;
    myArray[j] = tempi;
  }
}

// Shows slides
// courtesy of L Ouyang
function showSlide(id) {
  // Hide all slides
  $(".slide").hide();
  // Show just the slide we want to show
  $("#"+id).show();
}

// ## Configuration settings

// Shuffle stimuli
fisherYates(stim);

// #### Start the experiment

// ## Prep data storage
var allData = {
  
  fingerprintData: fingerprint,
  
}

// ## Run experiment
var experiment = {
  
  // Trials
  // deep copy since we are using .shift() but want to retain record of trial order
  trials: [],
  thisList: [],
	thisRetrieval: [],
	theseComments: [],
	theseResults: [],
  thisManip: '',
  
  // The function to initiate the experiment
  init: function() {

    experiment.thisList = stim;
    experiment.trials = $.extend(true, [], experiment.thisList);
	  experiment.theseResults = [];
    experiment.theseEmos = [];
    experiment.stimDur = stim_time;
    experiment.ITI = iti_time;
    experiment.numpos = 0;
    experiment.numneg = 0;
    experiment.numneut = 0;

    // Show instructions slide
		showSlide("instructions");

  },

	// The function that gets called for the first trial (1500 ms padding).
  leadin: function() {
    
    showSlide("leadin");
    $("#readytext").show()
    setTimeout(function(){
               
      $("#readytext").hide();
               
      setTimeout(function(){
        experiment.next();
      }, 1000)

    }, 2000);
    
 	},

  // The work horse of the sequence - what to do on every trial
  next: function() {
    
    // If the number of remaining trials is 0, we're done, so call the retrieve function.
		// If we're doing articulatory suppression, show the wait slide for 30 seconds first.
    if (experiment.trials.length == 0) {

      // showSlide("delay");
      //setTimeout(function () { experiment.retrieve() }, delay_time)
      experiment.retrieve();
      
    }
    
    else {
 
      // Get the current trial - <code>shift()</code> removes the first element of the array and returns it
      var thisWord = experiment.trials.shift();
      
    
      // Display the word
      $("#encword").text(thisWord);
      $("#encword").show();
      showSlide("stage");

    
      // Show stimulus for 3000 (or 1000) ms, then clear & impose 1000 ms ISI
      setTimeout(function(){
        $("#encword").hide();
        setTimeout(function(){ experiment.next() }, experiment.ITI);
        }, experiment.stimDur);
    }
    
  },

  
  // The function that gets called when it's time to retrieve.
  retrieve: function() {
      
    showSlide("retrieval");

  },

  // The function that gets called when it's time to display the results.
  results: function() {
		
		// prep results slide
		for (i = 0; i < experiment.thisList.length; i++) {

			var li = document.createElement("li");
			li.appendChild(document.createTextNode(experiment.thisList[i]));
			
			if (experiment.thisRetrieval.toLowerCase().indexOf(experiment.thisList[i]) > -1) {
                if (stim_neg.indexOf(experiment.thisList[i]) > -1) {
                    li.setAttribute("style", "font-weight: bold; color: #ff6666");
                    experiment.theseEmos.push('negative')
                    experiment.numneg += 1;
                }
                else if (stim_pos.indexOf(experiment.thisList[i]) > -1) {
                    li.setAttribute("style", "font-weight: bold; color: #33cc33");
                    experiment.theseEmos.push('positive')
                    experiment.numpos += 1;
                }
                else {
                    li.setAttribute("style", "font-weight: bold; color: #cc66ff");
                    experiment.theseEmos.push('neutral')
                    experiment.numneut +=1;
                }
                experiment.theseResults.push(1);
			}
			else {
				experiment.theseResults.push(0);
                experiment.theseEmos.push('forgotten')

			}
			$("#feedback")[0].appendChild(li);

		}
    
    // store all list data
    var task_vars = {
      thisList: experiment.thisList,
      thisRetrieval: experiment.thisRetrieval,
      theseComments: experiment.theseComments,
      theseResults: experiment.theseResults,
    }

		showSlide("results")

	},
	
  // The function that gets called when the whole experiment is finished.
  finish: function() {
		
		// Collect final comments
		showSlide("finished");
		turk.submit(experiment);

  	}

}


// ## Submit retrieval
$("#form_retrieval").submit( function (){
		 // store response
     var ret_text = $("#form_retrieval")[0].elements["words"].value;
     experiment.thisRetrieval = ret_text;
		 // clear response so that it doesn't show up on the next manipulation
		 $("#form_retrieval")[0].elements["words"].value = "";
		 // show results
		 experiment.results();
})


// ## Start!
// and encourage people to use Chrome
if (fingerprint.browser.search("Chrome") < 0 && fingerprint.browser.search("chrome") < 0) { showSlide("chrome")}
else { experiment.init() }

// from kyle
// $("#start_button").click(function() {
//      if (turk.previewMode) {
//         alert("Please accept HIT to view");
//     } else {
//      // code to start experiment
//    }
// })
