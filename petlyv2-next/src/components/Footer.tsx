import { PawPrint, Mail, Phone, ShieldCheck, MessageCircle, Globe, Share2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#050505] text-white py-16 md:py-20 border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="w-6 h-6 text-[#FF6B35]" />
              <span className="text-xl font-bold">Petly</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
              A maior rede de cuidadores de pets do Brasil. Cuidamos com amor e responsabilidade.
            </p>
            <div className="flex gap-3">
              <button className="p-2.5 bg-white/5 border border-white/10 hover:border-[#FF6B35] hover:bg-[#FF6B35] rounded-full transition-all active:scale-95 shadow-sm">
                <MessageCircle className="w-4 h-4" />
              </button>
              <button className="p-2.5 bg-white/5 border border-white/10 hover:border-[#FF6B35] hover:bg-[#FF6B35] rounded-full transition-all active:scale-95 shadow-sm">
                <Globe className="w-4 h-4" />
              </button>
              <button className="p-2.5 bg-white/5 border border-white/10 hover:border-[#FF6B35] hover:bg-[#FF6B35] rounded-full transition-all active:scale-95 shadow-sm">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4 font-semibold">Explore</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors font-medium">Como funciona</li>
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors font-medium">Encontrar Cuidador</li>
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors font-medium">Ser Cuidador</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white mb-4 font-semibold">Suporte</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4" /> contato@petly.com
              </li>
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4" /> (11) 99999-9999
              </li>
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4" /> Segurança
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-4 font-semibold">Legal</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors font-medium">Termos de Uso</li>
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors font-medium">Privacidade</li>
              <li className="hover:text-[#FF6B35] cursor-pointer transition-colors font-medium">Cookies</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm font-medium">
            © 2024 Petly. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
