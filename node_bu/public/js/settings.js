$(document).ready(function () {
    {
        $("#questions-nav-btn").on('click', function () {
            window.location.replace("questions");
        });
        $("#impacts-nav-btn").on('click', function () {
            window.location.replace("outliers");
        });
        $("#net-nav-btn").on('click', function () {
            window.location.replace("net");
        });

        $("#save-settings").click(async function () {
            let candidateName = $('#pov-choice option:selected').text();
            let filtersList = await getAllFilters();
            await set_pov(candidateName, filtersList);

            $.notify(`Settings Updated Successfully`,
                {
                    className: 'info settings-info',
                    globalPosition: 'top center',
                    autoHide: true,
                    autoHideDelay: 2000,
                    hideDuration: 200,
                    showDuration: 200
                });
        })
    }
});