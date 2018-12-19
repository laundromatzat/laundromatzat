const ft_input = document.getElementById("feet");
const in_input = document.getElementById("inches");
const lbs_input = document.getElementById("lbs");
const bmi_span = document.getElementById("bmi");
let interpretation = "";
const interpretation_div = document.getElementById("interpretation");

function calc() {
  var num = (lbs_input.value * 703);
  var den = ((parseFloat(ft_input.value) * 12) + parseFloat(in_input.value)) ** 2;
  var bmi = (num / den).toFixed(1);

  if (bmi < 10.0 || bmi == "NaN") {
    bmi = "";
    interpretation = "";
  }
  else if (bmi < 18.5) {
    interpretation = "underweight";
    interpretation_div.style.color = "#F56B62";
  }
  else if (bmi < 25.0) {
    interpretation = "healthy weight";
    interpretation_div.style.color = "#76C47D";
  }
  else if (bmi < 30.0) {
    interpretation = "overweight";
    interpretation_div.style.color = "#FFB531";
  }
  else if (bmi >= 30.0) {
    interpretation = "obese";
    interpretation_div.style.color = "#ED5144";
  }

  bmi_span.innerHTML = bmi;
  interpretation_div.innerHTML = interpretation;

}
