const fs = require('fs');

const filePath = './src/components/SettingsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Tambahkan tombol Logout di menu utama Settings
const targetMenu = `              {SETTINGS_MENU_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActivePopup(item.id)}
                  className="w-full p-4 rounded-xl bg-slate-900/80 hover:bg-purple-950/60 border border-purple-900/50 hover:border-yellow-500/60 flex items-center justify-between text-left transition-all duration-200 group cursor-pointer shadow-md active:scale-98"
                >
                  <span className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-yellow-300 transition-colors">
                    {item.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}`;

const replacementMenu = `              {SETTINGS_MENU_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActivePopup(item.id)}
                  className="w-full p-4 rounded-xl bg-slate-900/80 hover:bg-purple-950/60 border border-purple-900/50 hover:border-yellow-500/60 flex items-center justify-between text-left transition-all duration-200 group cursor-pointer shadow-md active:scale-98"
                >
                  <span className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-yellow-300 transition-colors">
                    {item.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}

              {/* Tombol Menu Logout (Warna Merah) Terletak Tepat di Bawah Menu Mode Tampilan Siang/Malam */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-red-950/70 via-red-900/40 to-slate-900 border border-red-700/70 hover:border-red-500 hover:from-red-900/80 hover:to-red-950 flex items-center justify-between text-left transition-all duration-200 group cursor-pointer shadow-md active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-900/80 border border-red-500/70 flex items-center justify-center text-red-200 group-hover:bg-red-800 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-red-300 uppercase tracking-wider group-hover:text-white transition-colors block">
                      Keluar / Logout Akun
                    </span>
                    <span className="text-[10px] text-red-400/80 block">
                      Keluar dari sesi akun {currentUser?.name ? currentUser.name.split(',')[0] : (currentUser?.username || 'pengguna')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-500/80 group-hover:text-red-300 group-hover:translate-x-1 transition-all shrink-0" />
              </button>`;

if (content.includes(targetMenu)) {
  content = content.replace(targetMenu, replacementMenu);
  console.log('Successfully added Logout button to main settings menu.');
} else {
  console.error('Target menu not found!');
}

// 2. Tambahkan tombol Logout di dalam tab 'theme'
const targetThemeEnd = `                      <p className={\`text-[11px] leading-relaxed \${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}\`}>
                        Sangat nyaman digunakan di ruang kantor kesiswaan, tata usaha, dan ruang guru saat mencetak lembar A4 di siang hari.
                      </p>
                    </div>
                  </div>
                </div>
              )}`;

const replacementThemeEnd = `                      <p className={\`text-[11px] leading-relaxed \${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}\`}>
                        Sangat nyaman digunakan di ruang kantor kesiswaan, tata usaha, dan ruang guru saat mencetak lembar A4 di siang hari.
                      </p>
                    </div>
                  </div>

                  {/* Tombol Logout Terletak di Bawah Menu Mode Tampilan Siang/Malam */}
                  <div className="pt-4 border-t border-purple-900/40">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full p-3.5 rounded-xl bg-gradient-to-r from-red-950/80 via-red-900/50 to-slate-950 hover:from-red-900/80 hover:to-red-950 border border-red-700/80 hover:border-red-500 text-red-200 hover:text-white flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-98"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Keluar / Logout dari Akun Ini</span>
                    </button>
                  </div>
                </div>
              )}`;

if (content.includes(targetThemeEnd)) {
  content = content.replace(targetThemeEnd, replacementThemeEnd);
  console.log('Successfully added Logout button in theme tab.');
} else {
  console.error('Target theme end not found!');
}

// 3. Tambahkan Modal Konfirmasi Logout di akhir
const targetModalEnd = `    </>
  );
};`;

const replacementModalEnd = `      {/* 3. MODAL KONFIRMASI LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-red-800/80 rounded-2xl p-6 shadow-2xl shadow-red-950/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-950 border border-red-600/80 flex items-center justify-center text-red-400 shadow-md">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Konfirmasi Keluar</h3>
                <p className="text-xs text-slate-400">Keluar dari akun SatriaApp Silat</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-red-950/30 border border-red-900/40 p-3 rounded-xl">
              Apakah Anda yakin ingin keluar dari akun <strong className="text-white">"{currentUser?.name || currentUser?.username}"</strong>? Seluruh data yang tersimpan tetap aman.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteLogout}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-950/60 transition-all cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};`;

if (content.includes(targetModalEnd)) {
  content = content.replace(targetModalEnd, replacementModalEnd);
  console.log('Successfully added Logout confirmation modal.');
} else {
  console.error('Target modal end not found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating SettingsModal.tsx for logout.');
