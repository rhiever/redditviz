$(document).ready(function() {
    if (navigator.appName == "Microsoft Internet Explorer") {
        $('#graph').css({color:"white", textAlign:"center", verticalAlign:"middle"}).html("Sorry, but this feature is not supported by Internet Explorer. Please try a different web browser.");
        return;
    }

    // Instanciate sigma.js and customize rendering :
    var container = $('#graph');
    var sigInst = sigma.init(container[0]).drawingProperties({
        defaultLabelColor: '#fff',
        defaultLabelSize: 14,
        defaultLabelBGColor: '#fff',
        defaultLabelHoverColor: '#000',
        labelThreshold: 6,
        defaultEdgeType: 'curve'
    }).graphProperties({
        minNodeSize: 0.5,
        maxNodeSize: 20,
        minEdgeSize: 1,
        maxEdgeSize: 15
    }).mouseProperties({
        maxRatio: 200
    });

    // Parse a GEXF encoded file to fill the graph
    // (requires "sigma.parseGexf.js" to be included)
    sigInst.parseGexf(graphData);

    // Bind events :
    var hideUnconnected = function(event) {
        var nodes = event.content;
        var neighbors = {};
        sigInst.iterEdges(function(e) {
            if(nodes.indexOf(e.source) >= 0 || nodes.indexOf(e.target) >=0 ) {
                neighbors[e.source] = 1;
                neighbors[e.target] = 1;
            }
        }).iterNodes(function(n) {
            if(!neighbors[n.id]) {
                n.hidden = 1;
            }
            else {
                n.hidden = 0;
                n.active = true;
            }
        }).draw(2,2,2);
    };

    var showUnconnected = function() {
        sigInst.iterEdges(function(e) {
            e.hidden = 0;
        }).iterNodes(function(n) {
            n.hidden = 0;
            n.active = false;
        }).draw(2,2,2);
    };

    var highlightConnected = function(event) {
        var nodes = event.content;
        var neighbors = {};
        sigInst.iterEdges(function(e) {
            if(nodes.indexOf(e.source) >= 0 || nodes.indexOf(e.target) >= 0) {
                neighbors[e.source] = 1;
                neighbors[e.target] = 1;
                e.hidden = 0;
            }
        }).iterNodes(function(n) {
            if(neighbors[n.id]) {
                n.active = true;
            }
        }).draw(2,2,2);
    };

    var unhighlightConnected = function() {
        sigInst.iterNodes(function(n) {
            n.active = false;
        }).iterEdges(function(e) {
            e.hidden = 1;
        }).draw(2,2,2);
    };

    sigInst.bind('upnodes', function(event) {
        var subreddit = sigInst.getNodes(event.content[0]).label;
        window.open("http://www.reddit.com/r/" + subreddit, "_blank");
    });

    sigInst.bind('overnodes', highlightConnected).bind('outnodes', unhighlightConnected);

    document.getElementById('reset-graph').addEventListener('click', function() {
        sigInst.position(0,0,1).draw();
    },true);

    $('#searchbox').bind('keydown', function(event) {
        if (event.which == 13) {
            searchTerm = $(event.target).val().toLowerCase();
            if (searchTerm.length == 0) {
                return;
            }
            // Reset the graph view
            sigInst.position(0,0,1).draw();

            found = false;
            sigInst.iterNodes(function(n) {
                if (!found) {
                    if (n.label.toLowerCase() == searchTerm) {
                        n.active = true;
                        sigInst.zoomTo(n.displayX, n.displayY, 40);
                        found = true;
                    }
                }
            });

            if (found) {
                $('#searchalert').hide();
            }
            else {
                $('#searchalert').show();
            }
        }
    });

    $('#searchbox').bind('mouseup', function(event) {
        var input = $(this),
        oldValue = input.val().toLowerCase();

        if (oldValue == "") {
            return;
        }

        // When this event is fired after clicking on the clear button
        // the value is not cleared yet. We have to wait for it.
        setTimeout(function() {
            var newValue = input.val();
            if (newValue.length == 0){
                // Gotcha
                var found = false;
                sigInst.iterNodes(function(n) {
                    if (!found) {
                        if (n.label.toLowerCase() == oldValue) {
                            n.active = false;
                            found = true;
                            sigInst.draw(2,2,2);
                        }
                    }
                });
            }
        }, 1);
    });

    // Sigma.js doesn't yet support hidden edges on initialisation, so let's do it manually
    sigInst.iterEdges(function(e) {
        e.hidden = 1;
    });

    // Also no initial zoom option. Let's calculate the start position manually

    var centre = {
        x: container.width() / 2,
        y: container.height() / 2
    };

    // Draw the graph:
    sigInst.draw(centre.x, centre.y, 8);
});

