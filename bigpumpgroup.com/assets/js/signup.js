var Signup = function() {
	"use strict";
	var runSetDefaultValidation = function() {
		$.validator.setDefaults({
			errorElement : "span", // contain the error msg in a small tag
			errorClass : 'help-block',
			errorPlacement : function(error, element) {// render error placement for each input type
				if (element.attr("type") == "radio" || element.attr("type") == "checkbox") {// for chosen elements, need to insert the error after the chosen container
					error.insertAfter($(element).closest('.form-group').children('div').children().last());
				} else if (element.attr("name") == "card_expiry_mm" || element.attr("name") == "card_expiry_yyyy") {
					error.appendTo($(element).closest('.form-group').children('div'));
				} else {
					error.insertAfter(element);
					// for other inputs, just perform default behavior
				}
			},
			ignore : ':hidden',
			success : function(label, element) {
				label.addClass('help-block valid');
				// mark the current input as valid and display OK icon
				$(element).closest('.form-group').removeClass('has-error');
			},
			highlight : function(element) {
				$(element).closest('.help-block').removeClass('valid');
				// display OK icon
				$(element).closest('.form-group').addClass('has-error');
				// add the Bootstrap error class to the control group
			},
			unhighlight : function(element) {// revert the change done by hightlight
				$(element).closest('.form-group').removeClass('has-error');
				// set error class to the control group
			}
		});
	};
	var runSignup = function() {
		
		var form = $('.form-signup');
		var errorHandler = $('.errorHandler', form);
		form.validate({
			rules : {
				name : {
					minlength : 2,
					required : true
				},
				email : {
					email:true,
					required : true
				},
				password : {
					minlength : 6,
					required : true
				},
				confirmpassword : {
					minlength : 6,
					equalTo: "#password"
				},
				checkbox_signup : {
					required : true
				}
				
			},
			submitHandler : function(form) {
				errorHandler.hide();
				//form.submit();
				if($("#adcopy_response").val()==''){
					$("#signup-error").show();
					$("#signup-error").html("The CAPTCHA field is required.");
					$(".btn-home-login").removeAttr("disabled");
					return false;
				}
				$("#signup-error").hide();
				blacklists.forEach(function(bl){
					if($("input#email").val().includes(bl))
					{
						// grecaptcha.reset();
						$("#signup-error").html("This email domain is not allowed");
						$("#signup-error").show();
						setTimeout( "jQuery('#signup-error').hide();",30000 );
						$(".btn-home-signup").removeAttr("disabled");
						// return process.exit(1);
					}
				});
				$(".btn-home-signup").attr("disabled", "disabled");
				$.ajax({
						url: base_url + 'Ajax/signup',
						method: 'POST',
						dataType: 'json',
						data: {
							referrer: $("input#referrer").val(),
							name: $("input#name").val(),
							email: $("input#email").val(),
							password: $("input#password").val(),
							confirmpassword: $("input#confirmpassword").val(),
							checkbox_signup: $("input#checkbox_signup").val(),
							g_recaptcha_response: $("#adcopy_response").val(),
							g_recaptcha_challenge: $("#adcopy_challenge").val(),
							csrf_hash : csrf_hash 
						},
						error: function()
						{
							//alert("Anfsdfew error occoured!");
							// grecaptcha.reset();
							$("#signup-error").show();
							setTimeout( "jQuery('#signup-error').hide();",30000 );
							$(".btn-home-signup").removeAttr("disabled");
						},
						success: function(response)
						{	
							if(response['message'] == 'success')
								{
									$("#signup-success").show();
									$("#email-mess").show();
								}
							else{
								// grecaptcha.reset();
								$("#signup-error").show();
								$("#signup-error").html(response['message']);
								setTimeout( "jQuery('#signup-error').hide();",30000 );
								$(".btn-home-signup").removeAttr("disabled");
							}
						}
				});
			},
			invalidHandler : function(event, validator) {//display error alert on form submit
				errorHandler.show();
			}
		});
	};
	return {
		//main function to initiate template pages
		init : function() {
			runSetDefaultValidation();
			runSignup();		
		}
	};
}();
