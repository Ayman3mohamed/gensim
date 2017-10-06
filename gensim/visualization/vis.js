var TopicModelVis = function(to_select, data_or_file_name) {

    // This section sets up the logic for event handling
    var current_clicked = {
        what: "nothing",
        element: undefined
    },
        current_hover = {
            what: "nothing",
            element: undefined
        },
        old_winning_state = {
            what: "nothing",
            element: undefined
        },
        vis_state = {
            doc: 0,
            topic: 0,
            word: 0
        };

    // Set up a few 'global' variables to hold the data:
    var D, // number of docs
        T, // number of topics
        W, // number of words
        docMdsData, // (x,y) locations and topic proportions
        topicMdsData,
        wordMdsData,
        doc_topic_info, // topic proportions for all docs in the viz
        doc_word_info,
        topic_doc_info,
        topic_word_info,
        word_doc_info,
        word_topic_info,
        color1 = "#1f77b4", // baseline color for default topic circles and overall word frequencies
        color2 = "#d62728"; // 'highlight' color for selected topics and word-topic frequencies

    // Set the duration of each half of the transition:
    var duration = 750;

    // Set global margins used for everything
    var margin = {
        top: 30,
        right: 30,
        bottom: 70,
        left: 30
    },
        mdswidth = 390,
        mdsheight = 530,
        mdsarea = mdsheight * mdswidth;
    // controls how big the maximum circle can be
    // doesn't depend on data, only on mds width and height:
    var rMax = 40;

    // proportion of area of MDS plot to which the sum of default topic circle areas is set
    var circle_prop = 0.25;
    var word_prop = 0.25;

    // opacity of topic circles:
    var base_opacity = 0.2,
        highlight_opacity = 0.6;

    // doc/topic/word selection names are specific to *this* vis
    var doc_select = to_select + "-doc";
    var topic_select = to_select + "-topic";
    var word_select = to_select + "-word";

    // get rid of the # in the to_select (useful) for setting ID values
    var visID = to_select.replace("#", "");
    var topID = visID + "-top";
    var docID = visID + "-doc";
    var topicID = visID + "-topic";
    var wordID = visID + "-word";
    // ---------
    var docDown = docID + "-down";
    var docUp = docID + "-up";
    var docClear = docID + "-clear";
    var topicDown = topicID + "-down";
    var topicUp = topicID + "-up";
    var topicClear = topicID + "-clear";
    var wordDown = wordID + "-down";
    var wordUp = wordID + "-up";
    var wordClear = wordID + "-clear"; 

    var docPanelID = visID + "-docPanel";
    var topicPanelID = visID + "-topicPanel";
    var wordPanelID = visID + "-wordPanel";

    //////////////////////////////////////////////////////////////////////////////


    function visualize(data) {

        // set the number of documents to global variable D:
        D = data['doc_mds'].x.length;
        // // set the number of topics to global variable T:
        T = data['topic_mds'].x.length;
        // set the number of words to global variable W:
        W = data['word_mds'].x.length;

        // a (D x 3) matrix with columns x, y, doc_tag
        docMdsData = [];
        for (var i = 0; i < D; i++) {
            var obj = {};
            for (var key in data['doc_mds']) {
                obj[key] = data['doc_mds'][key][i];
            }
            docMdsData.push(obj);
        }

        // a (T x 4) matrix with columns x, y, topics id, Freq
        topicMdsData = [];
        for (var i = 0; i < T; i++) {
            var obj = {};
            for (var key in data['topic_mds']) {
                obj[key] = data['topic_mds'][key][i];
            }
            topicMdsData.push(obj);
        }

        // a (W x 4) matrix with columns x, y, vocab word, Freq
        wordMdsData = [];
        for (var i = 0; i < W; i++) {
            var obj = {};
            for (var key in data['word_mds']) {
                obj[key] = data['word_mds'][key][i];
            }
            wordMdsData.push(obj);
        }


        doc_topic_info = [];
        for (var i = 0; i < data['doc_topic.info'].Doc.length; i++) {
            var obj = {};
            for (var key in data['doc_topic.info']) {
                obj[key] = data['doc_topic.info'][key][i];
            }
            doc_topic_info.push(obj);
        }

        doc_word_info = [];
        for (var i = 0; i < data['doc_word.info'].Doc.length; i++) {
            var obj = {};
            for (var key in data['doc_word.info']) {
                obj[key] = data['doc_word.info'][key][i];
            }
            doc_word_info.push(obj);
        }

        topic_doc_info = [];
        for (var i = 0; i < data['topic_doc.info'].Topic.length; i++) {
            var obj = {};
            for (var key in data['topic_doc.info']) {
                obj[key] = data['topic_doc.info'][key][i];
            }
            topic_doc_info.push(obj);
        }

        topic_word_info = [];
        for (var i = 0; i < data['topic_word.info'].Topic.length; i++) {
            var obj = {};
            for (var key in data['topic_word.info']) {
                obj[key] = data['topic_word.info'][key][i];
            }
            topic_word_info.push(obj);
        }

        word_doc_info = [];
        for (var i = 0; i < data['word_doc.info'].Word.length; i++) {
            var obj = {};
            for (var key in data['word_doc.info']) {
                obj[key] = data['word_doc.info'][key][i];
            }
            word_doc_info.push(obj);
        }

        word_topic_info = [];
        for (var i = 0; i < data['word_topic.info'].Word.length; i++) {
            var obj = {};
            for (var key in data['word_topic.info']) {
                obj[key] = data['word_topic.info'][key][i];
            }
            word_topic_info.push(obj);
        }


        // Create new svg element (that will contain everything):
        var svg = d3.select(to_select).append("svg")
                .attr("width", 3 * (mdswidth + margin.left) + margin.right)
                .attr("height", mdsheight + 2 * margin.top + margin.bottom + 2 * rMax);

        // Add a group for the doc plot
        var doc_plot = svg.append("g")
                .attr("id", docPanelID)
                .attr("class", "docpoints")
                .attr("transform", "translate(" + margin.left + "," + 2 * margin.top + ")");

        // Create a group for the topic plot
        var topic_plot = svg.append("g")
                .attr("id", topicPanelID)
                .attr("class", "topicpoints")
                // .attr("align","center")
                .attr("transform", "translate(" + (mdswidth + 2 * margin.left) + "," + 2 * margin.top + ")");

        // Add a group for the word plot
        var word_plot = svg.append("g")
                .attr("id", wordPanelID)
                .attr("class", "wordpoints")
                // .attr("align","right")
                .attr("transform", "translate(" + (2 * mdswidth + 3 * margin.left) + "," + 2 * margin.top + ")");


        // Clicking on the doc_plot should clear the selection
        doc_plot
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", mdsheight)
            .attr("width", mdswidth)
            .style("fill", color1)
            .attr("opacity", 0)
            .on("click", function() {
                state_reset();
                state_save(true);
            });

        // Clicking on the topic_plot should clear the selection
        topic_plot
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", mdsheight)
            .attr("width", mdswidth)
            .style("fill", color1)
            .attr("opacity", 0)
            .on("click", function() {
                state_reset();
                state_save(true);
            });

        // Clicking on the word_plot should clear the selection
        word_plot
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", mdsheight)
            .attr("width", mdswidth)
            .style("fill", color1)
            .attr("opacity", 0)
            .on("click", function() {
                state_reset();
                state_save(true);
            });        


        // bind mdsData to the points in the doc panel:
        var docpoints = doc_plot.selectAll("docpoints")
                .data(docMdsData)
                .enter();

        // text to indicate doc
        docpoints.append("text")
            .attr("class", "doc_txt")
            .attr("x", function(d) {
                return (doc_xScale(+d.x));
            })
            .attr("y", function(d) {
                return (doc_yScale(+d.y) + 4);
            })
            .attr("stroke", "black")
            .attr("opacity", 1)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fontWeight", 100)
            .text(function(d) {
                return d.docs;
            });

        // draw circles
        docpoints.append("circle")
            .attr("class", "docdot")
            .style("opacity", 0.2)
            .style("fill", color1)
            .attr("r", function(d) {
                //return (rScaleMargin(+d.Freq));
                return (Math.sqrt(mdswidth*mdsheight*circle_prop/Math.PI)/3);
            })
            .attr("cx", function(d) {
                return (doc_xScale(+d.x));
            })
            .attr("cy", function(d) {
                return (doc_yScale(+d.y));
            })
            .attr("stroke", "black")
            .attr("id", function(d) {
                return (docID + d.docs);
            })
            .on("mouseover", function(d) {
                var old_doc = docID + vis_state.doc;
                if (vis_state.doc > 0 && old_doc!= this.id) {
                    doc_off(document.getElementById(old_doc));
                }
                doc_on(this);
            })
            .on("click", function(d) {
                // prevent click event defined on the div container from firing
                // http://bl.ocks.org/jasondavies/3186840
                d3.event.stopPropagation();
                var old_doc = docID + vis_state.doc;
                if (vis_state.doc > 0 && old_doc != this.id) {
                    doc_off(document.getElementById(old_doc));
                }
                // make sure doc input box value and fragment reflects clicked selection
                document.getElementById(docID).value = vis_state.doc = d.docs;
                state_save(true);
                doc_on(this);
            })
            .on("mouseout", function(d) {
                if (vis_state.doc != d.docs) doc_off(this);
                if (vis_state.doc > 0) doc_on(document.getElementById(docID + vis_state.doc));
            });

        // bind mdsData to the points in the topic panel:
        var topicpoints = topic_plot.selectAll("topicpoints")
                .data(topicMdsData)
                .enter();

        // text to indicate topic
        topicpoints.append("text")
            .attr("class", "topic_txt")
            .attr("x", function(d) {
                return (topic_xScale(+d.x));
            })
            .attr("y", function(d) {
                return (topic_yScale(+d.y) + 4);
            })
            .attr("stroke", "black")
            .attr("opacity", 1)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fontWeight", 100)
            .text(function(d) {
                return d.topics;
            });

        // draw circles
        topicpoints.append("circle")
            .attr("class", "topicdot")
            .style("opacity", 0.2)
            .style("fill", color1)
            .attr("r", function(d) {
                //return (rScaleMargin(+d.Freq));
                return (Math.sqrt(mdswidth*mdsheight*circle_prop/Math.PI)/3);
            })
            .attr("cx", function(d) {
                return (topic_xScale(+d.x));
            })
            .attr("cy", function(d) {
                return (topic_yScale(+d.y));
            })
            .attr("stroke", "black")
            .attr("id", function(d) {
                return (topicID + d.topics);
            })
            .on("mouseover", function(d) {
                var old_topic = topicID + vis_state.topic;
                if (vis_state.topic > 0 && old_topic!= this.id) {
                    topic_off(document.getElementById(old_topic));
                }
                topic_on(this);
            })
            .on("click", function(d) {
                // prevent click event defined on the div container from firing
                // http://bl.ocks.org/jasondavies/3186840
                d3.event.stopPropagation();
                var old_topic = topicID + vis_state.topic;
                if (vis_state.topic > 0 && old_topic != this.id) {
                    topic_off(document.getElementById(old_topic));
                }
                // make sure topic input box value and fragment reflects clicked selection
                document.getElementById(topicID).value = vis_state.topic = d.topics;
                state_save(true);
                topic_on(this);
            })
            .on("mouseout", function(d) {
                if (vis_state.topic != d.topics) topic_off(this);
                if (vis_state.topic > 0) topic_on(document.getElementById(topicID + vis_state.topic));
            });

        // bind mdsData to the points in the word panel:
        var wordpoints = word_plot.selectAll("wordpoints")
                .data(wordMdsData)
                .enter();

        // text to indicate word
        wordpoints.append("text")
            .attr("class", "word_txt")
            .attr("x", function(d) {
                return (word_xScale(+d.x));
            })
            .attr("y", function(d) {
                return (word_yScale(+d.y) + 4);
            })
            .attr("stroke", "black")
            .attr("opacity", 1)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("fontWeight", 100)
            .text(function(d) {
                return d.vocab;
            });

        // draw circles
        wordpoints.append("circle")
            .attr("class", "worddot")
            .style("opacity", 0.2)
            .style("fill", color1)
            .attr("r", function(d) {
                //return (rScaleMargin(+d.Freq));
                return (Math.sqrt(mdswidth*mdsheight*circle_prop/Math.PI)/3);
            })
            .attr("cx", function(d) {
                return (word_xScale(+d.x));
            })
            .attr("cy", function(d) {
                return (word_yScale(+d.y));
            })
            .attr("stroke", "black")
            .attr("id", function(d) {
                return (wordID + d.vocab);
            })
            .on("mouseover", function(d) {
                var old_word = wordID + vis_state.word;
                if (vis_state.word > 0 && old_word!= this.id) {
                    word_off(document.getElementById(old_word));
                }
                word_on(this);
            })
            .on("click", function(d) {
                // prevent click event defined on the div container from firing
                // http://bl.ocks.org/jasondavies/3186840
                d3.event.stopPropagation();
                var old_word = wordID + vis_state.word;
                if (vis_state.word > 0 && old_word != this.id) {
                    word_off(document.getElementById(old_word));
                }
                // make sure word input box value and fragment reflects clicked selection
                document.getElementById(wordID).value = vis_state.word = d.vocab;
                state_save(true);
                word_on(this);
            })
            .on("mouseout", function(d) {
                if (vis_state.word != d.vocab) word_off(this);
                if (vis_state.word > 0) word_on(document.getElementById(wordID + vis_state.word));
            });


        // serialize the visualization state using fragment identifiers -- http://en.wikipedia.org/wiki/Fragment_identifier
        // location.hash holds the address information

        var params = location.hash.split("&");
        if (params.length > 1) {
            vis_state.doc = params[0].split("=")[1];
            vis_state.topic = params[1].split("=")[1];
            vis_state.word = params[2].split("=")[1];

            // Idea: write a function to parse the URL string
            // only accept values in [0,1] for lambda, {0, 1, ..., K} for topics (any string is OK for term)
            // Allow for subsets of the three to be entered:
            // (1) topic only (lambda = 1 term = "")
            // (2) lambda only (topic = 0 term = "") visually the same but upon hovering a topic, the effect of lambda will be seen
            // (3) term only (topic = 0 lambda = 1) only fires when the term is among the R most salient
            // (4) topic + lambda (term = "")
            // (5) topic + term (lambda = 1)
            // (6) lambda + term (topic = 0) visually lambda doesn't make a difference unless a topic is hovered
            // (7) topic + lambda + term

            // Short-term: assume format of "#topic=k&lambda=l&term=s" where k, l, and s are strings (b/c they're from a URL)

            // Force t (doc identifier) to be an integer between 0 and D:
            vis_state.doc = Math.round(Math.min(D, Math.max(0, vis_state.doc)));
            // Force t (topic identifier) to be an integer between 0 and T:
            vis_state.topic = Math.round(Math.min(T, Math.max(0, vis_state.topic)));
            // Force w (word identifier) to be an integer between 0 and W:
            vis_state.word = Math.round(Math.min(W, Math.max(0, vis_state.word)));

            // select the doc
            if (!isNaN(vis_state.doc)) {
                document.getElementById(docID).value = vis_state.doc;
                if (vis_state.doc > 0) {
                    doc_on(document.getElementById(docID + vis_state.doc));
                }
            }

            // select the topic
            if (!isNaN(vis_state.topic)) {
                document.getElementById(topicID).value = vis_state.topic;
                if (vis_state.topic > 0) {
                    topic_on(document.getElementById(topicID + vis_state.topic));
                }
            }

            // select the word
            if (!isNaN(vis_state.word)) {
                document.getElementById(wordID).value = vis_state.word;
                if (vis_state.word > 0) {
                    word_on(document.getElementById(wordID + vis_state.word));
                }
            }
        }


        function state_url() {
            return location.origin + location.pathname + "#doc=" + vis_state.doc +
                "&topic=" + vis_state.topic + "&word=" + vis_state.word;
        }

        function state_save(replace) {
            if (replace)
                history.replaceState(vis_state, "Query", state_url());
            else
                history.pushState(vis_state, "Query", state_url());
        }

        function state_reset() {
            if (vis_state.doc > 0) {
                doc_off(document.getElementById(docID + vis_state.doc));
            }
            if (vis_state.topic > 0) {
                topic_off(document.getElementById(topicID + vis_state.topic));
            }
            if (vis_state.word > 0) {
                word_off(document.getElementById(wordID + vis_state.word));
            }

            document.getElementById(docID).value = vis_state.doc = 0;
            document.getElementById(topicID).value = vis_state.topic = 0;
            document.getElementById(wordID).value = vis_state.word = 0;
            state_save(true);
        }

    }

    if (typeof data_or_file_name === 'string')
        d3.json(data_or_file_name, function(error, data) {visualize(data);});
    else
        visualize(data_or_file_name);

    // var current_clicked = {
    //     what: "nothing",
    //     element: undefined
    // },

    //debugger;

};