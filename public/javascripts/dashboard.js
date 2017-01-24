$(document).ready(function () {
	  $('#navbar-dashboard').addClass('active');
    var username = $("#username").val();
    var registrationIds = $("#regIds").val();
    var registrationDates = $("#regDates").val();

    regIds = registrationIds.split(","); //array of reg ids
    regDates = registrationDates.split(","); //array containing the date that each reg was submitted
    console.log(regDates);
    $.ajax({
        url: '/users/' + username,
        method: 'GET',
        success: function(data) {
          // loads the registrations into #registrations div and sets all controllers
          var content = '';
          if (regIds != ""){
            //displays registration objects with most recently submitted on top
            for(var i=regIds.length-1; i>=0; i--){ //regIds and regDates should be same length
              regId = regIds[i];
              dateAdded = regDates[i];
              //add buttons for each of these and have on click do a get to the url
              link = "/registrations/update/" + username +"/"+ regId;
              //console.log(dateAdded);
              content += "<div>Click <a href="+link+">here</a> to update the registration you submitted on: "+dateAdded + "</div><br>";
              $("#dashboard-registrations").html(content + "<br>");
            }
          }
          //loadRegistrations(registrations, currentUser, csrfToken);
        },
        error: function(error) {
          console.log('Error fetching registrations');
          console.log(error);
        }
      });
});