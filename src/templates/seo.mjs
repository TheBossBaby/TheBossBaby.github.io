// schema.org JSON-LD builders. Kept apart from markup so structured data
// can be reasoned about (and tested) on its own.

const personId = (ctx) => `${ctx.abs('/')}#person`;
const websiteId = (ctx) => `${ctx.abs('/')}#website`;

function person(ctx) {
  const { site, career } = ctx;
  const current = career.experience.find((job) => job.current);
  return {
    '@type': 'Person',
    '@id': personId(ctx),
    name: site.name,
    jobTitle: site.role,
    description: [].concat(site.intro).join(' '),
    url: ctx.abs('/'),
    image: ctx.abs(site.portrait.src),
    address: { '@type': 'PostalAddress', addressCountry: site.location },
    knowsAbout: site.seo.knowsAbout,
    alumniOf: career.education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.org })),
    ...(current ? { worksFor: { '@type': 'Organization', name: current.org } } : {}),
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

export function cvJsonLd(ctx) {
  const url = ctx.abs('/cv/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        url,
        name: `CV of ${ctx.site.name}`,
        isPartOf: { '@id': websiteId(ctx) },
        mainEntity: { '@id': personId(ctx) },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: ctx.abs('/') },
          { '@type': 'ListItem', position: 2, name: 'CV', item: url },
        ],
      },
      person(ctx),
    ],
  };
}

function videoObject(ctx, project) {
  const v = project.video;
  return {
    '@type': 'VideoObject',
    name: `${project.shortTitle || project.title}: video demo`,
    description: v.caption || project.summary,
    thumbnailUrl: ctx.abs(v.poster),
    contentUrl: ctx.abs(v.src),
    uploadDate: v.uploadDate,
    ...(v.duration ? { duration: v.duration } : {}),
    width: v.width,
    height: v.height,
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
    ...(project.video ? { video: videoObject(ctx, project) } : {}),
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
