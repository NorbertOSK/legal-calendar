import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, relative, sep } from 'path';
import * as Handlebars from 'handlebars';

export interface EmailThemeTokens {
  bodyBg: string;
  cardBg: string;
  border: string;
  primary: string;
  primaryHover: string;
  textPrimary: string;
  textSecondary: string;
  codeBg: string;
  buttonText: string;
}

export const EMAIL_THEME_TOKENS: EmailThemeTokens = {
  bodyBg: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  codeBg: '#EFF6FF',
  buttonText: '#FFFFFF',
};

export const createEmailThemeTokens = (): EmailThemeTokens => ({
  ...EMAIL_THEME_TOKENS,
});

export const REQUIRED_EMAIL_TEMPLATES = [
  'welcome',
  'email-verification',
  'forgot-password',
  'reset-password',
  'invitation',
  'appointment-created',
  'appointment-updated',
  'appointment-cancelled',
] as const;

export const REQUIRED_EMAIL_PARTIALS = ['layout', 'button', 'otp-box'] as const;

export type EmailTemplateName = (typeof REQUIRED_EMAIL_TEMPLATES)[number];
export type EmailPartialName = (typeof REQUIRED_EMAIL_PARTIALS)[number];

interface EmailThemeContext {
  theme: EmailThemeTokens;
}

export interface EmailTemplateContexts {
  welcome: EmailThemeContext & {
    name: string;
    dashboardUrl: string;
  };
  'email-verification': EmailThemeContext & {
    name: string;
    securityCode: string;
    verificationLink: string;
    purpose: string;
    dashboardUrl: string;
  };
  'forgot-password': EmailThemeContext & {
    name: string;
    token: string;
    dashboardUrl: string;
  };
  'reset-password': EmailThemeContext & {
    name: string;
    dashboardUrl: string;
  };
  invitation: EmailThemeContext & {
    inviterName: string;
    invitationLink: string;
    expirationHours: number;
    dashboardUrl: string;
  };
  'appointment-created': EmailThemeContext & {
    lawyerName: string;
    clientName: string;
    title: string;
    typeLabel: string;
    date: string;
    time: string;
    location: string;
    clientTime?: string;
    dashboardUrl: string;
  };
  'appointment-updated': EmailThemeContext & {
    lawyerName: string;
    clientName: string;
    title: string;
    typeLabel: string;
    date: string;
    time: string;
    location: string;
    clientTime?: string;
    dashboardUrl: string;
  };
  'appointment-cancelled': EmailThemeContext & {
    lawyerName: string;
    clientName: string;
    title: string;
    date: string;
    time: string;
    clientTime?: string;
    dashboardUrl: string;
  };
}

export const EMAIL_TEMPLATE_FIXTURES: EmailTemplateContexts = {
  welcome: {
    name: 'Test User',
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
  'email-verification': {
    name: 'Test User',
    securityCode: '123456',
    verificationLink: 'https://app.example.com/auth/verify-email?token=abc',
    purpose: 'signup',
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
  'forgot-password': {
    name: 'Test User',
    token: 'https://app.example.com/auth/reset-password?token=abc',
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
  'reset-password': {
    name: 'Test User',
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
  invitation: {
    inviterName: 'Admin User',
    invitationLink: 'https://app.example.com/auth/register-invited?token=abc',
    expirationHours: 72,
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
  'appointment-created': {
    lawyerName: 'Dr. Juan Perez',
    clientName: 'Maria Garcia',
    title: 'Consulta inicial',
    typeLabel: 'En persona',
    date: '01/04/2026',
    time: '10:00 - 11:00',
    location: 'Av. Corrientes 1234, CABA',
    clientTime: '01/04/2026 20:00 - 21:00',
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
  'appointment-updated': {
    lawyerName: 'Dr. Juan Perez',
    clientName: 'Maria Garcia',
    title: 'Consulta inicial',
    typeLabel: 'En persona',
    date: '02/04/2026',
    time: '14:00 - 15:00',
    location: 'Av. Corrientes 1234, CABA',
    clientTime: '01/04/2026 20:00 - 21:00',
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
  'appointment-cancelled': {
    lawyerName: 'Dr. Juan Perez',
    clientName: 'Maria Garcia',
    title: 'Consulta inicial',
    date: '01/04/2026',
    time: '10:00 - 11:00',
    clientTime: '01/04/2026 20:00 - 21:00',
    dashboardUrl: 'https://app.example.com',
    theme: createEmailThemeTokens(),
  },
};

export const resolveEmailTemplateDir = (
  nodeEnv = process.env.NODE_ENV,
  cwd = process.cwd(),
): string => {
  const srcDir = join(cwd, 'src', 'modules', 'email', 'templates');
  const distDir = join(cwd, 'dist', 'src', 'modules', 'email', 'templates');

  if (process.env.EMAIL_TEMPLATE_DIR) {
    return process.env.EMAIL_TEMPLATE_DIR;
  }

  if (nodeEnv === 'production') {
    return existsSync(distDir) ? distDir : srcDir;
  }

  return existsSync(srcDir) ? srcDir : distDir;
};

export const resolveEmailPartialsDir = (
  nodeEnv = process.env.NODE_ENV,
  cwd = process.cwd(),
): string => join(resolveEmailTemplateDir(nodeEnv, cwd), 'partials');

const listHandlebarsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listHandlebarsFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.hbs') ? [fullPath] : [];
  });
};

const toPartialName = (partialsDir: string, filePath: string): string =>
  relative(partialsDir, filePath)
    .replace(/\.hbs$/, '')
    .split(sep)
    .join('/');

const createHandlebarsRenderer = (partialsDir: string) => {
  const renderer = Handlebars.create();

  for (const partialFile of listHandlebarsFiles(partialsDir)) {
    renderer.registerPartial(
      toPartialName(partialsDir, partialFile),
      readFileSync(partialFile, 'utf8'),
    );
  }

  return renderer;
};

export const assertEmailTemplatesReady = (
  templateDir: string,
  fixtures: EmailTemplateContexts = EMAIL_TEMPLATE_FIXTURES,
  partialsDir = join(templateDir, 'partials'),
): void => {
  if (!existsSync(templateDir)) {
    throw new Error(
      `Email templates directory not found: ${templateDir}. Expected one of the required email template directories to exist.`,
    );
  }

  if (!existsSync(partialsDir)) {
    throw new Error(
      `Email partials directory not found: ${partialsDir}. Expected shared email partials to exist.`,
    );
  }

  for (const partialName of REQUIRED_EMAIL_PARTIALS) {
    const partialPath = join(partialsDir, `${partialName}.hbs`);

    if (!existsSync(partialPath)) {
      throw new Error(
        `Required email partial missing: ${partialPath}. Missing partial "${partialName}".`,
      );
    }
  }

  const renderer = createHandlebarsRenderer(partialsDir);

  for (const templateName of REQUIRED_EMAIL_TEMPLATES) {
    const templatePath = join(templateDir, `${templateName}.hbs`);

    if (!existsSync(templatePath)) {
      throw new Error(
        `Required email template missing: ${templatePath}. Missing template "${templateName}".`,
      );
    }

    const source = readFileSync(templatePath, 'utf8');
    const compiled = renderer.compile(source, { strict: true });
    compiled(fixtures[templateName]);
  }
};
