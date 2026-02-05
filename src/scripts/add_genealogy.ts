const selectContainer = document.getElementById('select-container');
const svgArea = document.getElementById('svg-display-area');
let count = 1;

document.getElementById('add-btn')?.addEventListener('click', () => {
    const selectContainer = document.getElementById('select-container');
    const firstSelect = selectContainer?.querySelector('select');
    const firstWrapper = svgArea?.querySelector('.tree-wrapper');

    if (firstSelect && firstWrapper && selectContainer) {
        const newSelect = firstSelect.cloneNode(true) as HTMLSelectElement;
        
        newSelect.setAttribute('data-index', count.toString());
        newSelect.selectedIndex = 0;
        
        selectContainer.appendChild(newSelect);

        const newWrapper = firstWrapper.cloneNode(true) as HTMLElement;
        newWrapper.setAttribute('data-index', count.toString());
        
        const newSvg = newWrapper.querySelector('svg');
        if (newSvg) {
            newSvg.id = `tree-svg-${count}`;
            newSvg.innerHTML = ''; 
        }
        
        svgArea.appendChild(newWrapper);
        
        count++;
    }
});

document.getElementById('remove-btn')?.addEventListener('click', () => {
    const selects = selectContainer?.querySelectorAll('select');
    if (selects && selects.length > 1) {
        selectContainer?.removeChild(selects[selects.length - 1]);
        svgArea?.removeChild(svgArea.lastElementChild!);
    }
});