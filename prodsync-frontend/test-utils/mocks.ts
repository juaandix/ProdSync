
export const mockFetchSuccess = (data: any = {}) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock;
};

export const mockFetchFailure = (data: any = {}) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock;
};
