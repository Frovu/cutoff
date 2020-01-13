function dropdown_filter() {
    let input, filter, ul, li, a, i;
    filter = $("#stationSearchButton").val().toUpperCase();
    a = $('#stationDd').find('.dropdown-menu a');
    for (i = 0; i < a.length; i++) {
        txtValue = a[i].textContent || a[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
        } else {
            a[i].style.display = "none";
        }
    }
}
