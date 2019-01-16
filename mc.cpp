#include "pxt.h"
using namespace pxt;
namespace MakerCloud {

    //%
    void obloqSetTxBufferSize(int size){
        if(size > 100) {
            size = 100;
        }
        uBit.serial.setTxBufferSize(size);
    }

    //%
    void obloqSetRxBufferSize(int size){
        if(size > 100) {
            size = 100;
        }
        uBit.serial.setRxBufferSize(size);
    }

}
