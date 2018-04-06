function bodyOnLoad() {
    var browserSupported = true;
    
    try {
        eval('"use strict"; class foo {}');
    }
    catch (e) {
        browserSupported = false;
    }

    if( browserSupported ) {
        var ticTacToe = new TicTacToe();
        ticTacToe.startMatch();
    }
    else {
        alert("Browser not Supported");
    }
}
