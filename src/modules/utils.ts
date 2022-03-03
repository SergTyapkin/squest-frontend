/**
 * strips tags from string
 *
 * @param s string to be stripped
 * @returns stripped string
 */
export function stripTags(s: string): string {
    return s.replace(/(<([^>]+)>)/gi, '');
}

/**
 * Returns value of a cookie by its name
 *
 * @param {string} name name of a cookie
 * @returns {string} value of a cookie
 */
export function getCookie(name: string): string | undefined {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

export function setCookie(name: string, value: string, options: {} = {}) {

    options = {
        path: '/',
        // при необходимости добавьте другие значения по умолчанию
        ...options
    };

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        // @ts-ignore
        const optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}

export function deleteCookie(name: string) {
    setCookie(name, "", {
        'max-age': -1
    })
}


/**
 * returns HTMLElement with specified id like JQuery-style
 *
 * @returns HTMLElement
 * @param elId
 */
export function $(elId: string): HTMLElement | null {
    return document.getElementById(elId);
}



let _elsTimeout: NodeJS.Timeout;
export function setTimedClass(elements: Array<HTMLElement>, className: string, timeout: number = 1500) {
    clearTimeout(_elsTimeout);
    elements.forEach(el => el.classList.add(className));
    _elsTimeout = setTimeout(() => {
        elements.forEach(el => el.classList.remove(className));
    }, timeout);
}
