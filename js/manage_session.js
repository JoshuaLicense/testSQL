$(document).ready(function() {
  $( ".sidebar" ).draggable({
    axis: "x",
    handle : `.sidebar-toggler`,
    containment: `.sidebar-container`,
    addClasses: false,
    stop: (event, ui) => {
      // to maintain position on resize
      const toPercentage = ui.position.left / ui.helper.parent().width() * 100;
      // small!
      if(toPercentage > 30) {
        ui.helper.css('left', 'calc(100% - 18.75rem)'); // minus width of container (closed)
      }

      ui.helper.css('left', toPercentage + '%');
    },
    drag: (event, { position : { left : offsetLeft }}) => {
      if (offsetLeft < 130) {
        // spin text (the container is wide enough)
        $(`.sidebar h6`).removeClass(`vertical`);
      } else {
        $(`.sidebar h6`).addClass(`vertical`);
      }
    }
  });

  $(`.sidebar-toggler`).on(`dblclick`, () => {
    const [{ offsetLeft }] = $(`.sidebar`).draggable(`widget`);
    $(`.sidebar`).css('left', +(offsetLeft === 276) || 'calc(100% - 18.75rem)');

    if (offsetLeft === 276) {
      // spin text (the container is wide enough)
      $(`.sidebar h6`).removeClass(`vertical`);
    } else {
      $(`.sidebar h6`).addClass(`vertical`);
    }
  });
});
