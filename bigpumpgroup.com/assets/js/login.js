var Login = function() {
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
	var runLoginValidator = function() {
		var form = $('.form-login');
		var errorHandler = $('.errorHandler', form);
		form.validate({
			rules : {
				email : {
					email: true,
					required : true,
				},
				password : {
					minlength : 6,
					required : true
				}
			},
			submitHandler : function(form) {
				errorHandler.hide();
				//form.submit();
				$(".btn-home-login").attr("disabled", "disabled");
				if($("#g-recaptcha-response").val()==''){
					$("#login-error").show();
					$("#login-error").html("The reCAPTCHA field is required.");
					$(".btn-home-login").removeAttr("disabled");
					return false;
				}
				$.ajax({
						url: base_url + 'ajax/login',
						method: 'POST',
						dataType: 'json',
						data: {
							email: $("input#email").val(),
							password: $("input#password").val(),
							g_recaptcha_response: $("#g-recaptcha-response").val(),
							csrf_hash : csrf_hash 
						},
						error: function()
						{
							alert("An error occoured!");
							// $("#login-error").show();
							// setTimeout( "jQuery('#login-error').hide();",3000 );
							grecaptcha.reset();
							$(".btn-home-login").removeAttr("disabled");
						},
						success: function(response)
						{	
							if(response.login_status == 'success')
								{
									setTimeout(function()
									{
										var redirect_url = base_url;
										
										if(response.redirect_url && response.redirect_url.length)
										{
											redirect_url = response.redirect_url;
										}
										
											window.top.location.href = redirect_url;
									}, 400);
								}
							else{
								grecaptcha.reset();
								$("#login-error").show();
								$("#login-error").html(response.login_status);
								setTimeout( "jQuery('#login-error').hide();",3000 );
								$(".btn-home-login").removeAttr("disabled");
							}
						}
				});
			},
			invalidHandler : function(event, validator) {//display error alert on form submit
				errorHandler.show();
			}
		});
	};
	var runForgotValidator = function() {
		var form2 = $('.form-forgot');
		var errorHandler2 = $('.errorHandler', form2);
		form2.validate({
			rules : {
				email : {
					required : true,
					email: true
				}
			},
			submitHandler : function(form) {
				errorHandler2.hide();
				//form2.submit();
				$(".btn-home-forgot").attr("disabled", "disabled");
				$.ajax({
						url: base_url + 'ajax/forgotpassword',
						method: 'POST',
						dataType: 'json',
						data: {
							email: $("input#email").val(),						
							csrf_hash : csrf_hash 
						},
						error: function()
						{
							alert("An error occoured!");
							$(".btn-home-forgot").removeAttr("disabled");
						},
						success: function(response)
						{	
							if(response.forgotpassword_status == 'success')
							{
								$(".forgotpassword").slideUp();
								$(".form-forgotpassword-success").slideDown('normal');
							}
							else alert("An error occoured!");
							$(".btn-home-forgot").removeAttr("disabled");
						}
				});
			},
			invalidHandler : function(event, validator) {//display error alert on form submit
				errorHandler2.show();
			}
		});
	};	
	return {
		//main function to initiate template pages
		init : function() {
			runSetDefaultValidation();
			runLoginValidator();
			runForgotValidator();			
		}
	};
}();
