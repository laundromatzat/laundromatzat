'use strict';

// Get current date
function getDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    
    if(dd<10) {
        dd = '0'+dd
    } 
    
    if(mm<10) {
        mm = '0'+mm
    } 
    
    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

/*
// Alert
alert( `Today is ${getDate()}` );
*/

// Prompt
//let name = prompt('Enter name', '');

let name='';

do {
    name = prompt('Enter name', '');
}
while (name != 'Stephen');

document.write(`${getDate()}</br>`);
document.write(`Welcome ${name}!</br>`);


