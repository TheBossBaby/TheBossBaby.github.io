// schema.org JSON-LD builders. Kept apart from markup so structured data
// can be reasoned about (and tested) on its own.

const personId = (ctx) => `${ctx.abs('/')}#person`;
const websiteId = (ctx) => `${ctx.abs('/')}#website`;

function person(ctx) {
  const { site, career } = ctx;
  return {
    '@type': 'Person',
    '@id': personId(ctx),
    name: site.name,
    jobTitle: site.role,
    description: site.intro,
    url: ctx.abs('/'),
    image: ctx.abs(site.portrait.src),
    address: { '@type': 'PostalAddress', addressCountry: site.location },
    knowsAbout: site.seo.knowsAbout,
    alumniOf: career.education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.org })),
    award: career.achievements.map((a) => a.title),
    sameAs: site.socials.map((s) => s.url),
  };
}

export function homeJsonLd(ctx) {
  const { site } = ctx;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId(ctx),
        url: ctx.abs('/'),
        name: site.name,
        description: site.seo.description,
        inLanguage: site.lang,
        publisher: { '@id': personId(ctx) },
      },
      {
        '@type': 'ProfilePage',
        url: ctx.abs('/'),
        name: site.seo.title,
        isPartOf: { '@id': websiteId(ctx) },
        mainEntity: { '@id': personId(ctx) },
        hasPart: ctx.projects.map((p) => ({ '@id': `${ctx.abs(ctx.projectPath(p))}#work` })),
      },
      person(ctx),
    ],
  };
}

export function projectJsonLd(ctx, project) {
  const url = ctx.abs(ctx.projectPath(project));
  const repos = project.links.filter((l) => /github\.com/.test(l.url)).map((l) => l.url);
  const work = {
    '@type': repos.length ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': `${url}#work`,
    name: project.title,
    headline: project.tagline,
    description: project.summary,
    url,
    image: ctx.abs(project.image.src),
    genre: project.category,
    keywords: project.tech.join(', '),
    creativeWorkStatus: project.status === 'wip' ? 'In progress' : 'Complete',
    author: { '@id': personId(ctx) },
    isPartOf: { '@id': websiteId(ctx) },
    ...(project.updated ? { dateModified: project.updated } : {}),
    ...(repos.length ? { codeRepository: repos[0], programmingLanguage: 'C++', sameAs: repos } : {}),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      work,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.abs('/') },
          { '@type': 'ListItem', position: 2, name: 'Work', item: `${ctx.abs('/')}#work` },
          { '@type': 'ListItem', position: 3, name: project.shortTitle || project.title, item: url },
        ],
      },
      person(ctx),
    ],
  };
}
