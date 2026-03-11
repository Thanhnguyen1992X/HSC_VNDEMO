import { z } from 'zod';
import { insertEmployeeSchema, insertCardViewSchema, adminLoginSchema, employees } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  admin: {
    login: {
      method: 'POST' as const,
      path: '/api/admin/login' as const,
      input: adminLoginSchema,
      responses: {
        200: z.object({ token: z.string(), message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/admin/upload' as const,
      // multipart/form-data, file field 'avatar'
      responses: {
        200: z.object({ url: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  public: {
    getEmployee: {
      method: 'GET' as const,
      path: '/api/public/employees/:id' as const,
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  employees: {
    list: {
      method: 'GET' as const,
      path: '/api/employees' as const,
      responses: {
        200: z.array(z.custom<typeof employees.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/employees/:id' as const,
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/employees' as const,
      input: insertEmployeeSchema,
      responses: {
        201: z.custom<typeof employees.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/employees/:id' as const,
      input: insertEmployeeSchema.partial(),
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/employees/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    toggleActive: {
      method: 'PATCH' as const,
      path: '/api/employees/:id/toggle' as const,
      input: z.object({ isActive: z.boolean() }),
      responses: {
        200: z.custom<typeof employees.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  analytics: {
    track: {
      method: 'POST' as const,
      path: '/api/analytics/track' as const,
      input: z.object({ employeeId: z.string(), source: z.enum(['qr', 'nfc', 'direct', 'unknown']) }),
      responses: {
        201: z.object({ success: z.boolean() }),
      }
    },
    summary: {
      method: 'GET' as const,
      path: '/api/analytics/summary' as const,
      responses: {
        200: z.object({
          totalViews: z.number(),
          totalProfiles: z.number(),
          totalActiveProfiles: z.number(),
          viewsBySource: z.array(z.object({ source: z.string(), count: z.number() })),
          topEmployees: z.array(z.object({ employeeId: z.string(), fullName: z.string(), viewCount: z.number() })),
          recentViews: z.array(z.object({ date: z.string(), count: z.number() }))
        }),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type AdminLoginInput = z.infer<typeof api.admin.login.input>;
export type TrackAnalyticsInput = z.infer<typeof api.analytics.track.input>;
