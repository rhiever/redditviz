var getGraph;

function init() {
    // Instanciate sigma.js and customize rendering :
    var sigInst = sigma.init(document.getElementById('graph')).drawingProperties({
        defaultLabelColor: '#fff',
        defaultLabelSize: 14,
        defaultLabelBGColor: '#fff',
        defaultLabelHoverColor: '#000',
        labelThreshold: 6,
        defaultEdgeType: 'curve'
    }).graphProperties({
        minNodeSize: 0.5,
        maxNodeSize: 5,
        minEdgeSize: 1,
        maxEdgeSize: 1
    }).mouseProperties({
        maxRatio: 200
    });

    // Parse a GEXF encoded file to fill the graph
    // (requires "sigma.parseGexf.js" to be included)
    sigInst.parseGexf('data/subreddits.gexf.gz', 'gzip');

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
        }).draw(2,2,2);
    };

    sigInst.bind('upnodes', function(event) {
        var subreddit = sigInst.getNodes(event.content[0]).label;
        window.open("http://www.reddit.com/r/" + subreddit, "_blank");
    });

    sigInst.bind('overnodes', highlightConnected).bind('outnodes', unhighlightConnected);
    $(document.getElementById('toggle-hiding')).data('toggle', false);

    document.getElementById('toggle-hiding').addEventListener('click', function(event) {
        var button = $(event.target)
        var toggle = button.data('toggle');
        if (toggle) {
            sigInst.unbind('overnodes',hideUnconnected).unbind('outnodes',showUnconnected);
            sigInst.bind('overnodes',highlightConnected).bind('outnodes',unhighlightConnected);
            button.html("Hide unconnected networks");
        }
        else {
            sigInst.unbind('overnodes',highlightConnected).unbind('outnodes',unhighlightConnected);
            sigInst.bind('overnodes',hideUnconnected).bind('outnodes',showUnconnected);
            button.html("Always show all networks");
        }
        $(event.target).data('toggle', !toggle);
    },true);

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
                        sigInst.zoomTo(n.displayX, n.displayY, 5);
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

    // Draw the graph :
    sigInst.activateFishEye().draw();

    // Add getter for dev work
    getGraph = function() {
        return sigInst;
    }
}


if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", init, false);
}
else {
    window.onload = init;
}

