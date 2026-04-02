import { join } from 'path';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import {
  assertEmailTemplatesReady,
  REQUIRED_EMAIL_PARTIALS,
  REQUIRED_EMAIL_TEMPLATES,
  resolveEmailPartialsDir,
  resolveEmailTemplateDir,
} from './email.config';

describe('email.config', () => {
  let sandboxDir: string;

  beforeEach(() => {
    sandboxDir = mkdtempSync(join(tmpdir(), 'email-config-spec-'));
  });

  afterEach(() => {
    delete process.env.EMAIL_TEMPLATE_DIR;
    rmSync(sandboxDir, { recursive: true, force: true });
  });

  it('prefers src templates in non-production environments', () => {
    mkdirSync(join(sandboxDir, 'src', 'modules', 'email', 'templates'), { recursive: true });
    mkdirSync(join(sandboxDir, 'dist', 'src', 'modules', 'email', 'templates'), { recursive: true });

    const templateDir = resolveEmailTemplateDir('dev', sandboxDir);

    expect(templateDir).toBe(join(sandboxDir, 'src', 'modules', 'email', 'templates'));
  });

  it('prefers dist templates in production when available', () => {
    mkdirSync(join(sandboxDir, 'src', 'modules', 'email', 'templates'), { recursive: true });
    mkdirSync(join(sandboxDir, 'dist', 'src', 'modules', 'email', 'templates'), { recursive: true });

    const templateDir = resolveEmailTemplateDir('production', sandboxDir);

    expect(templateDir).toBe(join(sandboxDir, 'dist', 'src', 'modules', 'email', 'templates'));
  });

  it('allows overriding the template directory via environment variable', () => {
    process.env.EMAIL_TEMPLATE_DIR = '/tmp/custom-email-templates';

    expect(resolveEmailTemplateDir('production', sandboxDir)).toBe(
      '/tmp/custom-email-templates',
    );
    expect(resolveEmailPartialsDir('production', sandboxDir)).toBe(
      '/tmp/custom-email-templates/partials',
    );
  });

  it('validates that all required templates and partials exist and compile', () => {
    expect(() =>
      assertEmailTemplatesReady(join(process.cwd(), 'src', 'modules', 'email', 'templates')),
    ).not.toThrow();
  });

  it('fails fast when a required template is missing', () => {
    const missingTemplate = REQUIRED_EMAIL_TEMPLATES[0];

    expect(() =>
      assertEmailTemplatesReady('/tmp/does-not-exist', undefined as never),
    ).toThrow(/Email templates directory not found/);

    expect(() =>
      assertEmailTemplatesReady(
        join(process.cwd(), 'src', 'modules', 'email'),
        undefined as never,
        join(process.cwd(), 'src', 'modules', 'email', 'templates', 'partials'),
      ),
    ).toThrow(
      new RegExp(
        `Missing template "${missingTemplate}"|Required email template missing`,
      ),
    );
  });

  it('fails fast when a required partial is missing', () => {
    const templatesDir = join(sandboxDir, 'templates');
    const partialsDir = join(templatesDir, 'partials');

    mkdirSync(partialsDir, { recursive: true });

    for (const template of REQUIRED_EMAIL_TEMPLATES) {
      writeFileSync(join(templatesDir, `${template}.hbs`), 'template body');
    }

    for (const partial of REQUIRED_EMAIL_PARTIALS.slice(1)) {
      writeFileSync(join(partialsDir, `${partial}.hbs`), 'partial body');
    }

    expect(() =>
      assertEmailTemplatesReady(templatesDir, undefined, partialsDir),
    ).toThrow(
      new RegExp(
        `Missing partial "${REQUIRED_EMAIL_PARTIALS[0]}"|Required email partial missing`,
      ),
    );
  });
});
