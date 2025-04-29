/* better use this as a compile step, final page is static either way */

const templates = document.querySelectorAll("tmpl");

for (const template of templates) {
    const src = template.getAttribute("src");
    const position = template.getAttribute("add") || "before";
    const extraContent = template.innerHTML;
    let content_is = false
    const replace = template
        .getAttributeNames()
        .filter(v => /^\$/.test(v))
        .map(v => v.slice(1))
        .reduce((acc, name) =>
            (acc[name] = template.getAttribute("$" + name),
            !content_is && !acc[name].length
                ? (content_is = name) : void 0,
            acc), {}
        )
    

    try {
        const response = await fetch(`/blob/templates/${src}`);
        if (!response.ok) throw new Error(`Failed to load ${src}`);
        let templateContent = await response.text();

        const replace_strings =
            [...templateContent.matchAll(/\$:([^]+?)(?:\|([^]*?)):\$/g)]
            .reduce((acc, [_, name, def]) => (acc[name] = def, acc), {})

        for (const name in replace_strings) {
            const replacement = (replace[name] ?? replace_strings[name])
                || extraContent
            templateContent = templateContent
                .replace(
                    `$:${name}|${replace_strings[name]}:$`,
                    replacement,
                )
        }

        const container = document.createElement("div");
        container.innerHTML = templateContent;

        if (content_is) {
            console.log(content_is)
        } else if (extraContent) {
            let content = container.firstElementChild;
            let children = content.children;
            if (!children) {
                template.remove();
                throw new Error("Can't add elements.");
            }
            let pos;
            if (position.startsWith("end")) {
                content.innerHTML += extraContent;
            } else if (position.startsWith("start")) {
                content.innerHTML = extraContent + content.innerHTML;
            } else if (position.startsWith("after")) {
                if (isNaN(pos = Number(position.match(/\d+/)?.[0]))) {
                    pos = children.length - 1;
                }
                if (children.length <= pos) pos = children.length - 1;

                children[pos].after(...template.childNodes);
            } else if (position === "before") {
                if (isNaN(pos = Number(position.match(/\d+/)?.[0]) + 1)) {
                    pos = 0;
                }
                if (children.length <= pos) pos = children.length - 1;

                children[pos].before(...template.childNodes);
            }
        }

        // Replace the <tmplt> tag with the loaded content
        template.replaceWith(...container.childNodes);
    } catch (error) {
        console.error(error);
        template.textContent = `Error loading ${src}`;
    }
}
