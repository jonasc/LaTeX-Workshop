import type { ILatexWorkshopPdfViewer, IPDFViewerApplication } from './interface.js'

declare const PDFViewerApplication: IPDFViewerApplication

export function getTrimScale() {
    const viewer = document.getElementById('viewer') as HTMLElement
    return Number(viewer.style.getPropertyValue('--trim-factor'))
}

export function registerPageTrimmer(lwApp: ILatexWorkshopPdfViewer) {
    lwApp.onPagesLoaded(() => {
        resizeDOM()
        repositionDOM()
        setTrimScale()
    })
    let prevScale = 0
    lwApp.onPageRendered(() => {
        const trimScale = calcTrimScale()
        if (trimScale === 1.0) {
            return
        }
        const viewer = document.getElementById('viewer') as HTMLElement
        const realScale = trimScale * Number(viewer.style.getPropertyValue('--scale-factor'))
        console.log(prevScale, realScale)
        if (realScale === prevScale) {
            return
        }
        prevScale = realScale
        refreshCanvas(realScale, viewer)
    })
    const trimSelect = document.getElementById('trimSelect') as HTMLElement
    trimSelect.addEventListener('change', setTrimScale)
    const scaleSelect = document.getElementById('scaleSelect') as HTMLSelectElement
    scaleSelect.addEventListener('change', setTrimScale)
}

function calcTrimScale() {
    const trimSelect = document.getElementById('trimSelect') as HTMLSelectElement
    if (trimSelect.selectedIndex <= 0) {
        return 1.0
    }
    const trimValue = trimSelect.options[trimSelect.selectedIndex].value
    return 1.0 / (1 - 2 * Number(trimValue))
}

function setTrimScale() {
    const trimScale = calcTrimScale()
    const viewer = document.getElementById('viewer') as HTMLElement
    viewer.style.setProperty('--trim-factor', `${trimScale}`)
    refreshCanvas(trimScale, viewer)
}

function refreshCanvas(trimScale?: number, viewer?: HTMLElement) {
    trimScale = trimScale ?? calcTrimScale()
    viewer = viewer ?? document.getElementById('viewer') as HTMLElement
    const realScale = trimScale * Number(viewer.style.getPropertyValue('--scale-factor'))
    PDFViewerApplication.pdfViewer.refresh(false, { scale: realScale.toString() })
}

function resizeDOM() {
    const viewer = document.getElementById('viewer') as HTMLElement
    for (const page of viewer.getElementsByClassName('page') as HTMLCollectionOf<HTMLElement>){
        page.style.setProperty('--unit-width', (page.style.width.match(/[0-9]+/) || ['0'])[0] + 'px')
        page.style.setProperty('--unit-height', (page.style.height.match(/[0-9]+/) || ['0'])[0] + 'px')
        page.style.width = page.style.width.replace('px)', 'px - 1px )')
        // calc(var(--scale-factor) * 792px)
        page.style.height = page.style.height.replace('px)', 'px * var(--trim-factor))')
    }
    const css = document.styleSheets[document.styleSheets.length - 1]
    css.insertRule(`
        .textLayer,
        .annotationLayer,
        .pdfViewer .page canvas {
            width: calc(var(--scale-factor) * var(--trim-factor) * var(--unit-width)) !important;
            height: calc(var(--scale-factor) * var(--trim-factor) * var(--unit-height)) !important;
            left: calc(var(--scale-factor) * var(--unit-width) * (1 - var(--trim-factor)) / 2) !important;
        }`, css.cssRules.length)
}

function repositionDOM() {
    for (const anno of document.getElementsByClassName('textAnnotation') as HTMLCollectionOf<HTMLElement>) {
        if (parseFloat(anno.style.left) <= 50) {
            continue
        }
        for (const popupWrapper of anno.getElementsByClassName('popupWrapper') as HTMLCollectionOf<HTMLElement>) {
            popupWrapper.style.right = '100%'
            popupWrapper.style.left = ''
        }
        for (const popup of anno.getElementsByClassName('popup') as HTMLCollectionOf<HTMLElement>) {
            popup.style.right = '0px'
        }
    }
}
